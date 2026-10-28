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

async function runPython(source, stdinText) {
  const stdin = encoder.encode(stdinText);
  let read = false;
  runtime.setStdin({
    stdin: () => {
      if (read || !stdin.length) return null;
      read = true;
      return stdin;
    },
  });
  runtime.setStdout({ write: (buffer) => writeOutput('stdout', buffer) });
  runtime.setStderr({ write: (buffer) => writeOutput('stderr', buffer) });
  self.postMessage({ type: 'executing' });
  await runtime.runPythonAsync(source);
  self.postMessage({ type: 'done', status: 'ok' });
}

function writeOutput(type, buffer) {
  emit(type, new TextDecoder().decode(buffer));
  return buffer.length;
}

function installJavaHelpers(compiler, support, sdk, classlib) {
  for (const [helper, standard] of Object.entries({
    BrowserScanner: 'java/util/Scanner',
    BrowserInputStreamReader: 'java/io/InputStreamReader',
    BrowserInputMismatchException: 'java/util/InputMismatchException',
  })) {
    const bytes = relocateJavaHelper(compiler, support, helper, standard);
    sdk[`${standard}.class`] = bytes.sdk;
    classlib[`${bytes.implementation}.class`] = bytes.classlib;
  }
}

function relocateJavaHelper(compiler, support, helper, standard) {
  let bytes = compiler.getOutputFile(`codeleet/runtime/${helper}.class`);
  if (helper !== 'BrowserInputMismatchException')
    bytes = support.relocateClass(
      bytes,
      'codeleet/runtime/BrowserInputMismatchException',
      'java/util/InputMismatchException',
    );
  const implementation = `org/teavm/classlib/${standard.slice(0, standard.lastIndexOf('/') + 1)}T${standard.slice(standard.lastIndexOf('/') + 1)}`;
  return {
    implementation,
    sdk: support.relocateClass(bytes, `codeleet/runtime/${helper}`, standard),
    classlib: support.relocateClass(
      bytes,
      `codeleet/runtime/${helper}`,
      implementation,
    ),
  };
}

function archiveJavaHelpers(compiler, support) {
  const inputClass = support.relocateClass(
    compiler.getOutputFile('codeleet/runtime/BrowserInputStream.class'),
    'codeleet/runtime/BrowserInputStream',
    'org/teavm/classlib/java/lang/TConsoleInputStream',
  );
  const sdk = {};
  const classlib = {
    'org/teavm/classlib/java/lang/TConsoleInputStream.class': inputClass,
  };
  installJavaHelpers(compiler, support, sdk, classlib);
  return { sdk, classlib };
}

async function compileJava(source, stdin) {
  const { compiler, load, support } = runtime;
  for (const [path, helper] of Object.entries(
    support.javaSupportSources(stdin),
  ))
    compiler.addSourceFile(path, helper);
  if (!compiler.compile()) return false;
  const archives = archiveJavaHelpers(compiler, support);
  await compiler.setSdk(
    new Int8Array(await support.classArchive(archives.sdk)),
  );
  await compiler.setTeaVMClasslib(
    new Int8Array(await support.classArchive(archives.classlib)),
  );
  compiler.clearSourceFiles();
  compiler.clearOutputFiles();
  compiler.addSourceFile('Main.java', source);
  if (
    !compiler.compile() ||
    !compiler.generateWebAssembly({ outputName: 'app', mainClass: 'Main' })
  )
    return false;
  await executeJavaProgram(compiler, load);
  return true;
}

async function executeJavaProgram(compiler, load) {
  const program = await load(compiler.getWebAssemblyOutputFile('app.wasm'), {
    noAutoImports: true,
    installImports(imports) {
      imports.teavmConsole.putcharStdout = consoleWriter('stdout');
      imports.teavmConsole.putcharStderr = consoleWriter('stderr');
    },
  });
  self.postMessage({ type: 'executing' });
  await program.exports.main([]);
  for (const flush of consoleWriters) flush();
}

async function runJava(source, stdin) {
  if (!(await compileJava(source, stdin))) {
    self.postMessage({ type: 'done', status: 'compile-error' });
    return;
  }
  self.postMessage({ type: 'done', status: 'ok' });
}

async function runSource(data) {
  if (language === 'python') await runPython(data.source, data.stdin);
  else await runJava(data.source, data.stdin);
}

async function handleMessage(data) {
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
    return;
  }
  if (data?.command !== 'run') return;
  try {
    await runSource(data);
  } catch (error) {
    reportRunError(error);
  }
}

function reportRunError(error) {
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

self.onmessage = ({ data }) => {
  void handleMessage(data);
};
