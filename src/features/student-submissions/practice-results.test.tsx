/* eslint-disable max-lines-per-function -- behavioral test suites keep related scenarios together. */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CaseResults, CustomResult, OutputBlock } from './practice-results';
import type { PracticeCase, PracticeResult } from './practice-tests';

const cases: PracticeCase[] = [
  { id: 'one', name: 'Add values', stdin: '2 3', expected_stdout: '5' },
  { id: 'two', name: 'Print text', stdin: '', expected_stdout: 'hello' },
];

describe('practice result presentation', () => {
  it('shows empty output placeholders and the standard error treatment', () => {
    const html = renderToStaticMarkup(
      <div>
        <OutputBlock label="Input" text="" />
        <OutputBlock label="Standard error" text="trace" error />
        <CustomResult result={null} />
      </div>,
    );
    expect(html.match(/\(empty\)/g)).toHaveLength(1);
    expect(html).toContain('border-red-100');
    expect(html).toContain('Run your code to see output.');
  });

  it('summarizes example and published cases with passed, failed, and unrun states', () => {
    const results: PracticeResult[] = [
      {
        ...cases[0],
        status: 'ok',
        stdout: '5',
        stderr: '',
        executionMs: 2,
        verdict: 'passed',
      },
      {
        ...cases[1],
        status: 'ok',
        stdout: 'wrong',
        stderr: 'details',
        executionMs: null,
        verdict: 'wrong-output',
      },
    ];
    const published = renderToStaticMarkup(
      <CaseResults
        cases={[
          ...cases,
          { id: 'three', name: 'Later', stdin: '', expected_stdout: '' },
        ]}
        results={results}
        action={<button>Run published tests</button>}
      />,
    );
    expect(published).toContain('1 of 3 passed · 2 run');
    expect(published).toContain('Passed');
    expect(published).toContain('Wrong output');
    expect(published).toContain('Standard error');
    expect(published).toContain('open=""');
    expect(published).toContain('Not run');
    expect(published).toContain('Run published tests');

    const examples = renderToStaticMarkup(
      <CaseResults cases={cases.slice(0, 1)} results={[]} kind="examples" />,
    );
    expect(examples).toContain('1 example case');
    expect(examples).toContain('Example test cases');
  });

  it('renders empty test cases and unavailable custom run output', () => {
    const casesHtml = renderToStaticMarkup(
      <CaseResults cases={[]} results={[]} />,
    );
    expect(casesHtml).toContain('No published test cases.');
    expect(casesHtml).toContain('0 public cases');

    const runHtml = renderToStaticMarkup(
      <CustomResult
        result={{
          status: 'unavailable',
          stdout: '',
          stderr: 'failed',
          executionMs: 1,
        }}
      />,
    );
    expect(runHtml).toContain('Runner unavailable');
    expect(runHtml).toContain('Standard output');
    expect(runHtml).toContain('failed');
    expect(runHtml).toContain('approximately 1 ms');
  });

  it('renders Public and Private visibility badges when is_public is set', () => {
    const mixedCases: PracticeCase[] = [
      {
        id: 'case-pub',
        name: 'Public Sample',
        stdin: '1',
        expected_stdout: '1',
        is_public: true,
      },
      {
        id: 'case-priv',
        name: 'Private Hidden',
        stdin: '2',
        expected_stdout: '2',
        is_public: false,
      },
    ];
    const html = renderToStaticMarkup(
      <CaseResults cases={mixedCases} results={[]} />,
    );
    expect(html).toContain('Public');
    expect(html).toContain('Private');
    expect(html).toContain('2 total cases');
    expect(html).toContain('Test cases');
  });
});
