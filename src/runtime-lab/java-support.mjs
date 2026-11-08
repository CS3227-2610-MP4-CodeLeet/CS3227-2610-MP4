// First-party compatibility classes, compiled in the browser with Main.java.
export function javaSupportSources(stdin) {
  const bytes = [...new TextEncoder().encode(stdin)]
    .map((value) => `(byte)${value}`)
    .join(',');
  return {
    'BrowserInputStream.java': `package codeleet.runtime;
public final class BrowserInputStream extends java.io.ByteArrayInputStream {
  public BrowserInputStream() { super(new byte[]{${bytes}}); }
}`,
    'BrowserInputStreamReader.java': BrowserInputStreamReaderSource(),
    'BrowserScanner.java': BrowserScannerSource(),
    'BrowserInputMismatchException.java': `package codeleet.runtime;
public final class BrowserInputMismatchException extends java.util.NoSuchElementException {
  public BrowserInputMismatchException() { super("Input does not match the requested number"); }
}`,
  };
}

function BrowserInputStreamReaderSource() {
  return `package codeleet.runtime;
public final class BrowserInputStreamReader extends java.io.Reader {
  private final java.io.InputStream input;
  private int pushed = -1;
  private int surrogate = -1;
  private boolean closed;
  public BrowserInputStreamReader(java.io.InputStream input) { if (input == null) throw new NullPointerException(); this.input = input; }
  public BrowserInputStreamReader(java.io.InputStream input, String charset) throws java.io.UnsupportedEncodingException {
    this(input); if (!charset.equalsIgnoreCase("UTF-8") && !charset.equalsIgnoreCase("UTF8")) throw new java.io.UnsupportedEncodingException(charset);
  }
  public BrowserInputStreamReader(java.io.InputStream input, java.nio.charset.Charset charset) {
    this(input); if (!charset.name().equalsIgnoreCase("UTF-8")) throw new IllegalArgumentException("Only UTF-8 is supported");
  }
  public String getEncoding() { return closed ? null : "UTF8"; }
  private int nextByte() throws java.io.IOException { if (pushed < 0) return input.read(); int value = pushed; pushed = -1; return value; }
  public int read() throws java.io.IOException {
    if (closed) throw new java.io.IOException("Stream closed");
    if (surrogate >= 0) { int value = surrogate; surrogate = -1; return value; }
    int first = nextByte(); if (first < 128) return first;
    int length = first >= 194 && first <= 223 ? 2 : first >= 224 && first <= 239 ? 3 : first >= 240 && first <= 244 ? 4 : 0;
    if (length == 0) return 65533;
    int code = first & (127 >> length);
    for (int i = 1; i < length; i++) {
      int next = nextByte();
      if (next < 128 || next > 191 || (i == 1 && ((first == 224 && next < 160) || (first == 240 && next < 144) || (first == 244 && next > 143)))) {
        pushed = next; return 65533;
      }
      code = (code << 6) | (next & 63);
    }
    if (code >= 55296 && code <= 57343) return 65533;
    if (code < 65536) return code;
    code -= 65536; surrogate = 56320 | (code & 1023); return 55296 | (code >> 10);
  }
  public int read(char[] target, int offset, int length) throws java.io.IOException {
    if (closed) throw new java.io.IOException("Stream closed");
    if (offset < 0 || length < 0 || offset > target.length - length) throw new IndexOutOfBoundsException();
    if (length == 0) return 0;
    int count = 0; while (count < length) { int value = read(); if (value < 0) break; target[offset + count++] = (char)value; }
    return count == 0 ? -1 : count;
  }
  public boolean ready() throws java.io.IOException { if (closed) throw new java.io.IOException("Stream closed"); return surrogate >= 0 || pushed >= 0 || input.available() > 0; }
  public void close() throws java.io.IOException { if (!closed) { closed = true; input.close(); } }
}`;
}

function BrowserScannerSource() {
  return `package codeleet.runtime;
public final class BrowserScanner implements java.io.Closeable {
  private final java.io.InputStream input;
  private String text;
  private int position;
  private boolean closed;
  private java.io.IOException failure;
  public BrowserScanner(java.io.InputStream input) { if (input == null) throw new NullPointerException(); this.input = input; }
  private void load() {
    if (closed) throw new IllegalStateException("Scanner closed");
    if (text != null) return;
    StringBuilder buffer = new StringBuilder();
    java.io.Reader reader = new java.io.InputStreamReader(input);
    try { int value; while ((value = reader.read()) >= 0) buffer.append((char)value); }
    catch (java.io.IOException error) { failure = error; }
    text = buffer.toString();
  }
  private int tokenStart() { load(); int start = position; while (start < text.length() && Character.isWhitespace(text.charAt(start))) start++; return start; }
  private String peek() {
    int start = tokenStart(); if (start == text.length()) throw new java.util.NoSuchElementException();
    int end = start; while (end < text.length() && !Character.isWhitespace(text.charAt(end))) end++;
    return text.substring(start, end);
  }
  private void consume(String token) { position = tokenStart() + token.length(); }
  public boolean hasNext() { return tokenStart() < text.length(); }
  public String next() { String token = peek(); consume(token); return token; }
  public boolean hasNextLine() { load(); return position < text.length(); }
  public String nextLine() {
    load(); if (position == text.length()) throw new java.util.NoSuchElementException();
    int start = position;
    while (position < text.length()) { char value = text.charAt(position); if (value == '\\n' || value == '\\r' || value == 133 || value == 8232 || value == 8233) break; position++; }
    String line = text.substring(start, position);
    if (position < text.length()) { char value = text.charAt(position++); if (value == '\\r' && position < text.length() && text.charAt(position) == '\\n') position++; }
    return line;
  }
  public int nextInt() { String token = peek(); try { int value = Integer.parseInt(token); consume(token); return value; } catch (NumberFormatException error) { throw new BrowserInputMismatchException(); } }
  public long nextLong() { String token = peek(); try { long value = Long.parseLong(token); consume(token); return value; } catch (NumberFormatException error) { throw new BrowserInputMismatchException(); } }
  public double nextDouble() { String token = peek(); try { double value = Double.parseDouble(token); consume(token); return value; } catch (NumberFormatException error) { throw new BrowserInputMismatchException(); } }
  public boolean hasNextInt() { if (!hasNext()) return false; try { Integer.parseInt(peek()); return true; } catch (NumberFormatException error) { return false; } }
  public java.io.IOException ioException() { return failure; }
  public void close() { if (!closed) { closed = true; try { input.close(); } catch (java.io.IOException error) { failure = error; } } }
}`;
}

// Only first-party helper class names are relocated. Student source/bytecode is untouched.
export function relocateClass(bytes, from, to) {
  const input = new Uint8Array(bytes);
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  if (view.getUint32(0) !== 0xcafebabe) throw new Error('Invalid helper class');
  const chunks = [input.slice(0, 10)];
  let offset = 10;
  for (let index = 1; index < view.getUint16(8); index += 1) {
    const start = offset;
    const tag = input[offset++];
    if (tag === 1) {
      const entry = relocateUtfEntry({ input, view, offset, start, from, to });
      offset = entry.offset;
      chunks.push(entry.chunk);
      continue;
    }
    const size = constantSizes[tag];
    if (!size) throw new Error(`Unsupported helper constant: ${tag}`);
    offset += size;
    if (tag === 5 || tag === 6) index += 1;
    chunks.push(input.slice(start, offset));
  }
  chunks.push(input.slice(offset));
  return join(chunks);
}

const constantSizes = {
  3: 4,
  4: 4,
  5: 8,
  6: 8,
  7: 2,
  8: 2,
  9: 4,
  10: 4,
  11: 4,
  12: 4,
  15: 3,
  16: 2,
  17: 4,
  18: 4,
  19: 2,
  20: 2,
};

function relocateUtfEntry({ input, view, offset, start, from, to }) {
  const length = view.getUint16(offset);
  const nextOffset = offset + 2 + length;
  const original = input.slice(offset + 2, nextOffset);
  const text = Array.from(original, (value) => String.fromCharCode(value)).join(
    '',
  );
  if (!text.includes(from))
    return { chunk: input.slice(start, nextOffset), offset: nextOffset };
  const encoded = Uint8Array.from(text.replaceAll(from, to), (character) =>
    character.charCodeAt(0),
  );
  const header = new Uint8Array(3);
  header[0] = 1;
  new DataView(header.buffer).setUint16(1, encoded.length);
  return { chunk: join([header, encoded]), offset: nextOffset };
}

function join(chunks) {
  const result = new Uint8Array(
    chunks.reduce((sum, chunk) => sum + chunk.length, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export async function classArchive(entries) {
  const chunks = [];
  for (const [name, content] of Object.entries(entries)) {
    const path = new TextEncoder().encode(name);
    const header = new Uint8Array(2);
    new DataView(header.buffer).setUint16(0, path.length);
    const size = new Uint8Array(4);
    new DataView(size.buffer).setUint32(0, content.length);
    chunks.push(header, path, size, content);
  }
  return new Uint8Array(
    await new Response(
      new Blob([join(chunks)])
        .stream()
        .pipeThrough(new CompressionStream('gzip')),
    ).arrayBuffer(),
  );
}
