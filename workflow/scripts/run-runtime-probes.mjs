// Node orchestrates Chromium only; all synthetic source runs inside the browser.
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const browser = await chromium.launch();
const sourceHashes = Object.fromEntries(await Promise.all(['lab.mjs', 'supervisor.mjs', 'worker.mjs', 'java-support.mjs'].map(async (name) => [name, createHash('sha256').update(await readFile(`src/runtime-lab/${name}`)).digest('hex')])));
const page = await browser.newPage();
const consoleErrors = [];
page.on('pageerror', (error) => consoleErrors.push(String(error).slice(0, 1000)));
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 1000)); });
const cases = [
  { name: 'python-hello-cold-assets', language: 'python', source: 'print("Hello Python")', expectedStatus: 'ok', expectedStdout: 'Hello Python\n' },
  { name: 'python-stdin-warm-assets', language: 'python', source: 'print(input().upper())', stdin: 'browser input\n', expectedStatus: 'ok', expectedStdout: 'BROWSER INPUT\n' },
  { name: 'python-stderr', language: 'python', source: 'import sys\nprint("stderr sample", file=sys.stderr)', expectedStatus: 'ok', expectedStderr: 'stderr sample\n' },
  { name: 'python-runtime-error', language: 'python', source: 'raise ValueError("synthetic runtime error")', expectedStatus: 'error' },
  { name: 'python-syntax-error', language: 'python', source: 'if :', expectedStatus: 'error' },
  { name: 'java-source-hello-cold-assets', language: 'java', source: 'public class Main { public static void main(String[] args) { System.out.println("Hello Java"); } }', expectedStatus: 'ok', expectedStdout: 'Hello Java\n' },
  { name: 'java-source-hello-warm-assets', language: 'java', source: 'public class Main { public static void main(String[] args) { System.out.println("Warm Java"); } }', expectedStatus: 'ok', expectedStdout: 'Warm Java\n' },
  { name: 'java-compiler-error', language: 'java', source: 'public class Main { public static void main(String[] args) { BROKEN SOURCE } }', expectedStatus: 'compile-error' },
  { name: 'java-runtime-error', language: 'java', source: 'public class Main { public static void main(String[] args) { throw new RuntimeException("synthetic runtime error"); } }', expectedStatus: 'error' },
  { name: 'java-stdin-acceptance-gate', language: 'java', source: 'public class Main { public static void main(String[] args) { java.util.Scanner scanner = new java.util.Scanner(System.in); System.out.println(scanner.nextLine()); } }', stdin: 'java input\n', expectedStatus: 'ok', expectedStdout: 'java input\n', acceptanceGateOnly: true },
  { name: 'java-minimal-stdin-acceptance-gate', language: 'java', source: 'public class Main { public static void main(String[] args) throws Exception { System.out.println(System.in.read()); } }', stdin: 'j', expectedStatus: 'ok', expectedStdout: '106\n', acceptanceGateOnly: true },
];
const results = [];
let assertionFailures = 0;
try {
  await page.goto('http://127.0.0.1:3130');
  await page.waitForFunction(() => Boolean(window.runtimeLab));
  for (const test of cases) {
    const result = await page.evaluate((item) => window.runtimeLab.run(item), test);
    let passed = true;
    try {
      assert.equal(result.status, test.expectedStatus);
      if (test.expectedStdout !== undefined) assert.equal(result.stdout, test.expectedStdout);
      if (test.expectedStderr !== undefined) assert.equal(result.stderr, test.expectedStderr);
    } catch { passed = false; assertionFailures += 1; }
    results.push({ name: test.name, ...result, acceptanceGateOnly: Boolean(test.acceptanceGateOnly), passed });
    console.log(JSON.stringify(results.at(-1)));
  }
  const report = { measured_at: new Date().toISOString(), operator: '/root', sourceHashes, node: process.version, browser: browser.version(), cases: results, consoleErrors };
  await writeFile('workflow/evidence/runtime-feasibility/browser-results.json', JSON.stringify(report, null, 2) + '\n');
  if (assertionFailures) process.exitCode = 1;
} finally { await browser.close(); }
