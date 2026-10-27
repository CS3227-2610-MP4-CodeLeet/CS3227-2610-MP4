// Node 24 orchestrates Chromium; every Java compilation/execution occurs in its worker.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';

const sourceHashes = Object.fromEntries(await Promise.all(
  ['lab.mjs', 'supervisor.mjs', 'worker.mjs', 'java-support.mjs'].map(async (name) =>
    [name, createHash('sha256').update(await readFile(`src/runtime-lab/${name}`)).digest('hex')]),
));
const main = (body, imports = '') => `${imports}\npublic class Main { public static void main(String[] args) throws Exception { ${body} } }`;
const scanner = 'java.util.Scanner s = new java.util.Scanner(System.in);';
const tests = [
  ['direct-byte-and-eof', main('System.out.println(System.in.read()); System.out.println(System.in.read());'), 'j', '106\n-1\n'],
  ['empty-byte-input', main('System.out.println(System.in.read());'), '', '-1\n'],
  ['utf8-unsigned-bytes', main('int n; while ((n=System.in.read())!=-1) System.out.print(n+" ");'), 'é', '195 169 '],
  ['bulk-byte-read', main('byte[] b = new byte[5]; int n=System.in.read(b,1,3); System.out.println(n+":"+b[1]+":"+b[2]+":"+b[3]+":"+System.in.read());'), 'abcd', '3:97:98:99:100\n'],
  ['scanner-import-and-line', main('Scanner s = new Scanner(System.in); System.out.println(s.nextLine());', 'import java.util.Scanner;'), 'java input\n', 'java input\n'],
  ['scanner-unicode-supplementary', main(`${scanner} System.out.println(s.nextLine());`), '你好 café 🐍\n', '你好 café 🐍\n'],
  ['scanner-crlf-blank-final-line', main(`${scanner} while(s.hasNextLine()) System.out.println("["+s.nextLine()+"]");`), 'one\r\n\r\nlast', '[one]\n[]\n[last]\n'],
  ['scanner-token-and-line-cursor', main(`${scanner} System.out.println(s.nextInt()); System.out.println("["+s.nextLine()+"]"); System.out.println(s.next()); System.out.println(s.nextLong()); System.out.println(s.hasNext());`), '42 rest\r\nword 9223372036854775807', '42\n[ rest]\nword\n9223372036854775807\nfalse\n'],
  ['scanner-integer-boundaries', main(`${scanner} System.out.println(s.nextInt()); System.out.println(s.nextInt());`), '-2147483648 +2147483647', '-2147483648\n2147483647\n'],
  ['scanner-double', main(`${scanner} System.out.println(s.nextDouble()+s.nextDouble());`), '1.25 2.5', '3.75\n'],
  ['scanner-mismatch-does-not-consume', main(`${scanner} try { s.nextInt(); } catch (java.util.InputMismatchException e) { System.out.println(s.next()); } System.out.println(s.nextInt());`), 'oops 8', 'oops\n8\n'],
  ['scanner-overflow', main(`${scanner} System.out.println(s.hasNextInt()); try { s.nextInt(); } catch (java.util.InputMismatchException e) { System.out.println(s.next()); }`), '2147483648', 'false\n2147483648\n'],
  ['scanner-empty-and-exhaustion', main(`${scanner} System.out.println(s.hasNext()); System.out.println(s.hasNextLine()); try { s.nextLine(); } catch (java.util.NoSuchElementException e) { System.out.println("EOF"); }`), '', 'false\nfalse\nEOF\n'],
  ['scanner-closed', main(`${scanner} s.close(); try { s.hasNext(); } catch (IllegalStateException e) { System.out.println("closed"); }`), 'unused', 'closed\n'],
  ['buffered-reader-utf8', main('java.io.BufferedReader r = new java.io.BufferedReader(new java.io.InputStreamReader(System.in)); String line; while((line=r.readLine())!=null) System.out.println(line);'), 'café 🐍\r\nlast', 'café 🐍\nlast\n'],
  ['reader-explicit-utf8-and-char-buffer', main('java.io.Reader r = new java.io.InputStreamReader(System.in,"UTF-8"); char[] b=new char[2]; int n; while((n=r.read(b,0,b.length))!=-1) System.out.print(new String(b,0,n));'), 'a🐍é', 'a🐍é'],
  ['reader-charset-constructor', main('java.io.Reader r=new java.io.InputStreamReader(System.in,java.nio.charset.StandardCharsets.UTF_8); System.out.println((char)r.read());'), 'é', 'é\n'],
  ['reader-unsupported-encoding', main('try { new java.io.InputStreamReader(System.in,"UTF-16"); } catch(java.io.UnsupportedEncodingException e) { System.out.println("unsupported"); }'), '', 'unsupported\n'],
  ['stdin-is-data', main(`${scanner} System.out.println(s.nextLine());`), '"}); throw new Error("bad"); //\n', '"}); throw new Error("bad"); //\n'],
  ['maximum-stdin-bytes', main('int n=0; while(System.in.read()!=-1) n++; System.out.println(n);'), 'x'.repeat(4096), '4096\n'],
  ['fresh-run-does-not-reuse-input', main(`${scanner} System.out.println(s.nextLine());`), 'fresh input', 'fresh input\n'],
  ['stdout-stderr-no-newline', main('System.out.print("🐍"); System.err.print("é");'), '', '🐍', 'é'],
  ['compiler-errors-still-reported', 'public class Main { broken source }', '', '', undefined, 'compile-error'],
  ['runtime-errors-still-reported', main('throw new RuntimeException("synthetic");'), '', '', undefined, 'error'],
  ['unsupported-scanner-method-is-diagnostic', main(`${scanner} s.useDelimiter(",");`), '', '', undefined, 'compile-error'],
];
const browser = await chromium.launch();
const page = await browser.newPage();
const requests = [];
page.on('request', (request) => requests.push({ method: request.method(), url: request.url(), hasBody: request.postData() !== null }));
const cases = [];
async function test(name, operation) {
  try { cases.push({ name, passed: true, ...(await operation()) }); }
  catch (error) { cases.push({ name, passed: false, error: String(error) }); }
  console.log(JSON.stringify(cases.at(-1)));
}
try {
  await page.goto('http://127.0.0.1:3130');
  await page.waitForFunction(() => Boolean(window.runtimeLab));
  for (const [name, source, stdin, stdout, stderr, status = 'ok'] of tests) {
    await test(name, async () => {
      const result = await page.evaluate((input) => window.runtimeLab.run(input), { language: 'java', source, stdin });
      assert.equal(result.status, status, JSON.stringify(result));
      assert.equal(result.stdout, stdout);
      if (stderr !== undefined) assert.equal(result.stderr, stderr);
      return { result };
    });
  }
  await test('java-output-bound', async () => {
    const result = await page.evaluate((source) => window.runtimeLab.run({ language: 'java', source }), main('while(true) System.out.print("界");'));
    assert.equal(result.status, 'output-limit', JSON.stringify(result));
    const bytes = Buffer.byteLength(result.stdout + result.stderr);
    assert.ok(bytes <= 8192 && bytes >= 8189);
    return { result: { ...result, stdout: undefined, stdoutBytes: Buffer.byteLength(result.stdout) } };
  });
  await test('java-loop-deadline', async () => {
    const result = await page.evaluate((source) => window.runtimeLab.run({ language: 'java', source, timeoutMs: 3000 }), main('System.out.println("started"); while(true) {}'));
    assert.equal(result.status, 'timeout', JSON.stringify(result));
    assert.equal(result.stdout, 'started\n');
    return { result };
  });
  await test('java-stop-executing-loop', async () => {
    const result = await page.evaluate(async (source) => {
      const pending = window.runtimeLab.run({ language: 'java', source, timeoutMs: 10000 });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      window.runtimeLab.stop(); return pending;
    }, main('System.out.println("started"); while(true) {}'));
    assert.equal(result.status, 'stopped', JSON.stringify(result));
    assert.equal(result.stdout, 'started\n');
    return { result };
  });
  await test('java-rerun-after-termination', async () => {
    const result = await page.evaluate((source) => window.runtimeLab.run({ language: 'java', source, stdin: '9' }), main(`${scanner} System.out.println(s.nextInt());`));
    assert.equal(result.status, 'ok', JSON.stringify(result)); assert.equal(result.stdout, '9\n'); return { result };
  });
  await test('stdin-over-limit-rejected', async () => {
    const error = await page.evaluate(async (source) => { try { await window.runtimeLab.run({ language: 'java', source, stdin: 'x'.repeat(4097) }); return null; } catch(error) { return error.message; } }, main(''));
    assert.equal(error, 'Invalid or oversized lab input'); return { error };
  });
  await test('no-source-posts-or-external-requests', async () => {
    const transfers = requests.filter((request) => !request.url.startsWith('blob:'));
    assert.ok(transfers.every((request) => request.method === 'GET' && !request.hasBody && new URL(request.url).origin === 'http://127.0.0.1:3130'), JSON.stringify(transfers));
    return { requestCount: requests.length };
  });
} finally {
  await writeFile('workflow/evidence/runtime-feasibility/java-input-tests.json', JSON.stringify({ measuredAt: new Date().toISOString(), operator: '/root implementation and testing; no new independent review', node: process.version, browser: browser.version(), sourceHashes, cases }, null, 2) + '\n');
  await browser.close();
}
if (cases.some((item) => !item.passed)) process.exitCode = 1;
