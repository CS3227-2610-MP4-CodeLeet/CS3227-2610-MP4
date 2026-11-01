import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CaseResults, CustomResult } from './practice-results';
import type { BrowserRun } from './practice-tests';

const unsupported = 'teavm: Class {{c0}} is not supported on current target\n';
const explanation =
  'This program uses a feature that the code runner does not support.';
const compileErrorStatus = 'compile-error';

function run(stderr: string, status = compileErrorStatus): BrowserRun {
  return Object.freeze({ status, stdout: '', stderr, executionMs: null });
}

it.each([
  unsupported,
  'teavm: Class java.example.Unsupported is not supported on current target\n',
  'teavm: Method is not annotated with {{c0}}\n',
])(
  'explains a recognized compatibility failure without guessing a class or thread',
  (stderr) => {
    const result = run(stderr);
    const html = renderToStaticMarkup(<CustomResult result={result} />);
    expect(html).toContain(explanation);
    expect(html).toContain('Compile error');
    expect(html).not.toContain('{{c0}}');
    expect(html).not.toContain('Thread.start');
    expect(result.stderr).toBe(stderr);
  },
);

it('keeps syntax and line details alongside a compatibility explanation', () => {
  const stderr = "javac: Main.java:4: ';' expected\n" + unsupported;
  const html = renderToStaticMarkup(<CustomResult result={run(stderr)} />);
  expect(html).toContain('Main.java:4:');
  expect(html).toContain('expected');
  expect(html).toContain(explanation);
});

it.each(['ok', 'error', 'timeout'])(
  'keeps diagnostic-like program stderr literal for %s',
  (status) => {
    const html = renderToStaticMarkup(
      <CustomResult result={run(unsupported, status)} />,
    );
    expect(html).toContain(unsupported.trim());
    expect(html).not.toContain(explanation);
  },
);

it('does not reinterpret normal javac errors mentioning Thread or Runnable', () => {
  const html = renderToStaticMarkup(
    <CustomResult
      result={run(
        'javac: cannot find symbol: method start() in class MyRunnable\n',
      )}
    />,
  );
  expect(html).toContain(
    'cannot find symbol: method start() in class MyRunnable',
  );
  expect(html).not.toContain(explanation);
});

it('uses the same explanation for failed practice cases without changing their verdict', () => {
  const item = {
    id: 'sample',
    name: 'Sample',
    stdin: '',
    expected_stdout: '1\n',
  };
  const result = { ...item, ...run(unsupported), verdict: compileErrorStatus };
  const html = renderToStaticMarkup(
    <CaseResults cases={[item]} results={[result]} />,
  );
  expect(html).toContain(explanation);
  expect(html).toContain('Compile error');
  expect(result.verdict).toBe(compileErrorStatus);
  expect(result.stderr).toBe(unsupported);
});

it('renders untrusted error markup as text', () => {
  const html = renderToStaticMarkup(
    <CustomResult result={run('javac: <img src=x onerror=alert(1)>\n')} />,
  );
  expect(html).toContain('&lt;img');
  expect(html).not.toContain('<img');
});
