import { describe, expect, it } from 'vitest';
import { MAX_SOURCE_BYTES, validateSource } from './source-validation';

describe('source input rules', () => {
  it.each(['', '  \n\t\r\n'])('rejects blank source %j', (source) => {
    expect(validateSource(source).error).toBe(
      'Enter some code before checking it.',
    );
  });

  it.each([
    ['print("hello")', 14],
    ['é', 2],
    ['你', 3],
    ['😀', 4],
  ])('counts UTF-8 bytes for %s', (source, bytes) => {
    expect(validateSource(source)).toEqual({ byteLength: bytes, error: null });
  });

  it.each([
    'a'.repeat(MAX_SOURCE_BYTES),
    'é'.repeat(MAX_SOURCE_BYTES / 2),
    '😀'.repeat(MAX_SOURCE_BYTES / 4),
  ])('allows the exact byte boundary', (source) => {
    expect(validateSource(source)).toEqual({
      byteLength: MAX_SOURCE_BYTES,
      error: null,
    });
    expect(validateSource(source + 'a').error).toContain('exceeds');
  });

  it.each(['x\0y', '\ud800', '\udc00', '\ud800x', 'x\udc00'])(
    'rejects NUL or malformed Unicode %j',
    (source) => {
      expect(validateSource(source).error).not.toBeNull();
    },
  );

  it('accepts plain source text without executing or interpreting markup', () => {
    const source = '\t<script>throw new Error("not executed")</script>\n';
    expect(validateSource(source)).toEqual({
      byteLength: new TextEncoder().encode(source).length,
      error: null,
    });
    expect(source.startsWith('\t')).toBe(true);
  });
});
