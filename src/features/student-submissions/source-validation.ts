export const MAX_SOURCE_BYTES = 32_768;

export type SourceValidation = {
  byteLength: number;
  error: string | null;
};

function isWellFormed(source: string) {
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = source.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
}

// Local feedback only. Server validation and database invariants are still
// required when the shared submission service is connected.
export function validateSource(source: string): SourceValidation {
  const byteLength = new TextEncoder().encode(source).byteLength;
  let error: string | null = null;
  if (byteLength > MAX_SOURCE_BYTES) {
    error =
      'Code exceeds the 32 KiB limit. Shorten it to 32,768 UTF-8 bytes or fewer.';
  } else if (!isWellFormed(source)) {
    error =
      'Code contains an invalid Unicode character. Remove it and try again.';
  } else if (source.includes('\0')) {
    error = 'Code cannot contain NUL characters. Remove them and try again.';
  } else if (source.trim().length === 0) {
    error = 'Enter some code before checking it.';
  }
  return { byteLength, error };
}
