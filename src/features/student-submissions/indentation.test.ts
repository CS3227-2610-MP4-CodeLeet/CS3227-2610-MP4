import { describe, expect, it } from 'vitest';
import { getIndentationEdit } from './indentation';

function edit(
  source: string,
  start: number,
  key: string,
  options: { language?: 'python' | 'java'; end?: number; shift?: boolean } = {},
) {
  const { language = 'python', end = start, shift = false } = options;
  const change = getIndentationEdit({
    source,
    start,
    end,
    key,
    language,
    shift,
  });
  if (!change) return null;
  return {
    source:
      source.slice(0, change.from) + change.insert + source.slice(change.to),
    start: change.start,
    end: change.end,
  };
}

describe('editor indentation', () => {
  it('indents an empty first line without changing the next line', () => {
    expect(edit('\na', 0, 'Tab', { end: 1 })).toEqual({
      source: '    \na',
      start: 4,
      end: 5,
    });
  });
  it('keeps an empty first line intact when unindenting at position zero', () => {
    expect(edit('\na', 0, 'Tab', { end: 0, shift: true })).toEqual({
      source: '\na',
      start: 0,
      end: 0,
    });
  });
  it('does not dedent a brace typed inside a Java block comment', () => {
    expect(edit('/*\n    ', 7, '}', { language: 'java' })).toBeNull();
  });
  it('inserts spaces to the next four-column stop', () => {
    expect(edit('ab', 2, 'Tab')).toEqual({ source: 'ab  ', start: 4, end: 4 });
  });
  it('indents selected lines and preserves selected content', () => {
    expect(edit('a\nb\nc', 0, 'Tab', { end: 4 })).toEqual({
      source: '    a\n    b\nc',
      start: 4,
      end: 12,
    });
  });
  it('unindents selected lines with mixed tabs and spaces', () => {
    expect(
      edit('    a\n\tb', 0, 'Tab', { language: 'java', end: 8, shift: true }),
    ).toEqual({
      source: 'a\nb',
      start: 0,
      end: 3,
    });
  });
  it('unindents the current line at a collapsed selection', () => {
    expect(edit('  a', 3, 'Tab', { end: 3, shift: true })).toEqual({
      source: 'a',
      start: 1,
      end: 1,
    });
  });
});

describe('automatic newline indentation', () => {
  it.each(['if value:', 'if value: # explanation'])(
    'indents after a Python block %s',
    (source) => {
      expect(edit(source, source.length, 'Enter')?.source).toBe(
        `${source}\n    `,
      );
    },
  );
  it.each([
    '# if value:',
    'text = "colon:"',
    '"""\ntext:',
    '/* {',
    'String value = "{";',
  ])('ignores delimiters in strings/comments: %s', (source) => {
    const language =
      source.startsWith('/*') || source.startsWith('String')
        ? 'java'
        : 'python';
    expect(edit(source, source.length, 'Enter', { language })?.source).toBe(
      `${source}\n`,
    );
  });
  it('keeps existing leading tabs on a normal newline', () => {
    expect(edit('\tvalue = 1', 10, 'Enter')?.source).toBe('\tvalue = 1\n\t');
  });
  it('splits a Java brace pair with the cursor on the inner line', () => {
    expect(
      edit('    if (ready) {}', 16, 'Enter', { language: 'java' }),
    ).toEqual({
      source: '    if (ready) {\n        \n    }',
      start: 25,
      end: 25,
    });
  });
  it('splits Python bracket pairs', () => {
    expect(edit('values = []', 10, 'Enter')?.source).toBe(
      'values = [\n    \n]',
    );
  });
  it('dedents a Java closing brace on a blank indented line', () => {
    expect(edit('    ', 4, '}', { language: 'java' })).toEqual({
      source: '}',
      start: 1,
      end: 1,
    });
  });
  it('replaces a selection on Enter while preserving the remaining source', () => {
    expect(edit('  abc xyz', 5, 'Enter', { end: 9 })?.source).toBe('  abc\n  ');
  });
  it('leaves unrelated keys to native editing', () => {
    expect(edit('text', 4, 'ArrowLeft')).toBeNull();
  });
});
