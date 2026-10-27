// Executed ONLY as an opaque browser module worker; never imported by Node.
let runtime;
let language;
let outputBytes = 0;
let outputLimitHit = false;
const consoleWriters = [];
const encoder = new TextEncoder();
function emit(type, text) {
  const bytes = encoder.encode(text);
  if (outputBytes + bytes.length > 8192) {
    outputLimitHit = true;
    const remaining = Math.max(0, 8192 - outputBytes);
    self.postMessage({
      type,
      text: new TextDecoder().decode(bytes.slice(0, remaining), {
        stream: true,
      }),
    });
    self.postMessage({ type: 'done', status: 'output-limit' });
    throw new Error('LAB_OUTPUT_LIMIT');
  }
  outputBytes += bytes.length;
  self.postMessage({ type, text });
}
function moduleURL(bytes) {
  return URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' }));
}
function consoleWriter(type) {
  let text = '';
  const flush = () => {
    if (text) {
      const chunk = text;
      text = '';
      emit(type, chunk);
    }
  };
  consoleWriters.push(flush);
  return (character) => {
    text += String.fromCharCode(character);
    // TeaVM emits UTF-16 units. Keep surrogate pairs in one UTF-8 output chunk.
    if (
      character === 10 ||
      (text.length >= 256 && !(character >= 0xd800 && character <= 0xdbff))
    )
      flush();
  };
}
async function initialize(data) {
  language = data.language;
  const assets = data.assets;
  // The shim serves only already-present byte buffers. No fallback fetch exists;
  // CSP connect-src none independently blocks XHR/WebSocket/native fetch.
  self.fetch = async (input) => {
    const url =
      typeof input === 'string'
        ? input
        : String(input.url ?? input.href ?? input);
    const prefix = 'https://runtime.invalid/';
    if (
      !url.startsWith(prefix) ||
      !Object.hasOwn(assets, url.slice(prefix.length))
    )
      throw new Error(
        'Network denied: only preloaded runtime bytes are available',
      );
    const name = url.slice(prefix.length);
    return new Response(assets[name], {
      headers: {
        'Content-Type': name.endsWith('.wasm')
          ? 'application/wasm'
          : 'application/octet-stream',
      },
    });
  };
  // Avoid descendant-worker amplification. Browser memory remains a residual risk.
  for (const name of ['Worker', 'SharedWorker'])
    Object.defineProperty(self, name, {
      value: undefined,
      writable: false,
      configurable: false,
    });
  if (language === 'python') {
    const { loadPyodide } = await import(moduleURL(assets['pyodide.mjs']));
    const { default: createModule } = await import(
      moduleURL(assets['pyodide.asm.mjs'])
    );
    runtime = await loadPyodide({
      indexURL: 'https://runtime.invalid/',
      lockFileContents: new TextDecoder().decode(assets['pyodide-lock.json']),
      createPyodideModule: (settings) =>
        createModule({ ...settings, wasmBinary: assets['pyodide.asm.wasm'] }),
    });
  } else {
    const { load } = await import(
      moduleURL(assets['compiler.wasm-runtime.js'])
    );
    const compilerModule = await load(new Uint8Array(assets['compiler.wasm']), {
      noAutoImports: true,
    });
    const compiler = compilerModule.exports.createCompiler();
    compiler.setSdk(new Int8Array(assets['compile-classlib-teavm.bin']));
    compiler.setTeaVMClasslib(
      new Int8Array(assets['runtime-classlib-teavm.bin']),
    );
    compiler.onDiagnostic((diagnostic) =>
      emit('stderr', `${diagnostic.type}: ${diagnostic.message}\n`),
    );
    const support = await import(moduleURL(assets['java-support.mjs']));
    runtime = { compiler, load, support };
  }
  self.postMessage({ type: 'ready' });
}

self.onmessage = async ({ data }) => {
  try {
    if (data?.command === 'initialize') {
      try {
        await initialize(data);
      } catch (error) {
        self.postMessage({
          type: 'done',
          status: 'initialization-error',
          detail: String(error),
        });
      }
    } else if (data?.command === 'run') {
      if (language === 'python') {
        const stdin = encoder.encode(data.stdin);
        let read = false;
        runtime.setStdin({
          stdin: () => {
            if (read || !stdin.length) return null;
            read = true;
            return stdin;
          },
        });
        runtime.setStdout({
          write: (buffer) => {
            emit('stdout', new TextDecoder().decode(buffer));
            return buffer.length;
          },
        });
        runtime.setStderr({
          write: (buffer) => {
            emit('stderr', new TextDecoder().decode(buffer));
            return buffer.length;
          },
        });
        self.postMessage({ type: 'executing' });
        await runtime.runPythonAsync(data.source);
      } else {
        const { compiler, load, support } = runtime;
        for (const [path, source] of Object.entries(
          support.javaSupportSources(data.stdin),
        ))
          compiler.addSourceFile(path, source);
        if (!compiler.compile()) {
          self.postMessage({ type: 'done', status: 'compile-error' });
          return;
        }
        const inputClass = support.relocateClass(
          compiler.getOutputFile('codeleet/runtime/BrowserInputStream.class'),
          'codeleet/runtime/BrowserInputStream',
          'org/teavm/classlib/java/lang/TConsoleInputStream',
        );
        const sdk = {};
        const classlib = {
          'org/teavm/classlib/java/lang/TConsoleInputStream.class': inputClass,
        };
        for (const [helper, standard] of Object.entries({
          BrowserScanner: 'java/util/Scanner',
          BrowserInputStreamReader: 'java/io/InputStreamReader',
          BrowserInputMismatchException: 'java/util/InputMismatchException',
        })) {
          let bytes = compiler.getOutputFile(
            `codeleet/runtime/${helper}.class`,
          );
          // References between first-party helpers are relocated along with the class name.
          if (helper !== 'BrowserInputMismatchException')
            bytes = support.relocateClass(
              bytes,
              'codeleet/runtime/BrowserInputMismatchException',
              'java/util/InputMismatchException',
            );
          sdk[`${standard}.class`] = support.relocateClass(
            bytes,
            `codeleet/runtime/${helper}`,
            standard,
          );
          const split = standard.lastIndexOf('/');
          const implementation = `org/teavm/classlib/${standard.slice(0, split + 1)}T${standard.slice(split + 1)}`;
          classlib[`${implementation}.class`] = support.relocateClass(
            bytes,
            `codeleet/runtime/${helper}`,
            implementation,
          );
        }
        await compiler.setSdk(new Int8Array(await support.classArchive(sdk)));
        await compiler.setTeaVMClasslib(
          new Int8Array(await support.classArchive(classlib)),
        );
        compiler.clearSourceFiles();
        compiler.clearOutputFiles();
        compiler.addSourceFile('Main.java', data.source);
        if (
          !compiler.compile() ||
          !compiler.generateWebAssembly({
            outputName: 'app',
            mainClass: 'Main',
          })
        ) {
          self.postMessage({ type: 'done', status: 'compile-error' });
          return;
        }
        const program = await load(
          compiler.getWebAssemblyOutputFile('app.wasm'),
          {
            noAutoImports: true,
            installImports(imports) {
              imports.teavmConsole.putcharStdout = consoleWriter('stdout');
              imports.teavmConsole.putcharStderr = consoleWriter('stderr');
            },
          },
        );
        self.postMessage({ type: 'executing' });
        await program.exports.main([]);
        for (const flush of consoleWriters) flush();
      }
      self.postMessage({ type: 'done', status: 'ok' });
    }
  } catch (error) {
    if (!outputLimitHit) {
      try {
        for (const flush of consoleWriters) flush();
      } catch {
        /* Preserve output-limit status. */
      }
    }
    self.postMessage({
      type: 'done',
      status:
        outputLimitHit || String(error).includes('LAB_OUTPUT_LIMIT')
          ? 'output-limit'
          : 'error',
      detail: String(error),
    });
  }
};
