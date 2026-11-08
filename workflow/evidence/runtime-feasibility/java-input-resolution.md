# Java buffered input resolution — 27 October 2026

Status: the input blocker is resolved in the **standalone Chromium lab**. App integration, runtime distribution/provenance review and the browser matrix remain open. This follow-up was implemented and tested by `/root`, with no new specialist delegation or independent review. Earlier specialist reports describe the earlier snapshot only.

## Implementation and supported behavior

The upstream snapshot's console input stream could not read supplied stdin, and its SDK did not contain Scanner. A first experiment compiling classes directly in java.lang/java.util failed Java module checks. The successful approach compiles first-party compatibility classes in a private package, relocates **only those helper class names**, and supplies them through TeaVM's SDK/class-library APIs. Main.java is passed to javac unchanged, after helper compilation; student bytecode is not rewritten. Each run has a fresh compiler, input array and worker.

The input stream wraps the supplied UTF-8 bytes in ByteArrayInputStream. Stdin becomes numeric byte literals in first-party helper source, never interpolated executable text. Compilation and class relocation/archive creation occur inside the opaque browser worker. Node only serves files and orchestrates Chromium; it never invokes javac or executes a submitted Java program.

An additional failure appeared when Scanner used the snapshot's text reader: TeaVM reported @JSByRef operations unsupported by Wasm GC. A first-party UTF-8 InputStreamReader supplies this path without native JavaScript imports. BufferedReader continues to use the upstream implementation. Console output now batches UTF-16 units without splitting surrogate pairs, preserving emoji and preventing one message per character from prematurely hitting the message budget. Stop requests let the trusted supervisor retain bounded output before worker termination; a 100 ms fallback still removes a frame that fails to reply.

| Input API | Supported scope |
| --- | --- |
| System.in | Buffered bytes, bulk reads and -1 at EOF; maximum stdin 4,096 UTF-8 bytes |
| InputStreamReader | UTF-8 default, UTF-8 String/Charset constructors, character/buffer reads, ready, close, getEncoding |
| BufferedReader | Verified readLine with UTF-8, CRLF and EOF using the replacement reader |
| Scanner(InputStream) | next, nextLine, hasNext, hasNextLine, nextInt, hasNextInt, nextLong, nextDouble, close, ioException |
| Errors | NoSuchElementException at exhaustion, InputMismatchException without consuming invalid/overflowing numeric tokens, IllegalStateException after close |

This Scanner is a deliberately limited compatibility implementation for buffered exercise input, not a complete JDK Scanner. It reads the available stream on first access. Do not mix it with further direct reads from the same stream expecting JDK lookahead behavior. Regex/custom delimiters, locale/radix configuration, alternate constructors and other methods are unsupported and fail compilation. Numeric input uses Java's basic parseInt/parseLong/parseDouble syntax, without locale grouping support. The replacement reader supports UTF-8 only; unsupported String encodings throw UnsupportedEncodingException and unsupported Charset values throw IllegalArgumentException. Decoder edge-case equivalence for arbitrary malformed byte streams is not established; supplied stdin is encoded by TextEncoder. System.setIn and general JDK compatibility are not added.

## Actual verification

- [31/31 Java assertions](java-input-tests.json): direct/bulk byte reads, EOF/empty input, imported Scanner, Unicode/supplementary characters, CRLF/blank/final lines, token/line cursor behavior, integer limits/overflow, double parsing, mismatch recovery, closed scanner, BufferedReader, explicit UTF-8 reader constructors, data containing code-like text, exact 4,096-byte bound/rejection above it, fresh input, stdout/stderr without newlines, compile/runtime errors, unsupported APIs, bounded output, deadline/Stop of a loop that printed a start marker, rerun and no source HTTP transmission.
- [11/11 browser-boundary assertions replayed by the coordinator](java-input-boundary-tests.json): original independently authored harness, rerun on the new source hashes. This is **not a new independent review**. Includes opaque-origin/private-data denial, native network API denial, bridge/message/output caps, preparation retry, Python cancellation/rerun and real Java compilation.
- Functional Python/Java [probe matrix](browser-results.json) now treats failed stdin gates as nonzero exit failures. The two previously unmet Java stdin cases are mandatory assertions, not tolerated failures.
- Existing 24 application unit tests and targeted ESLint checks passed. Exact final check outcomes are recorded in the [session log](../../../logs/2026-10-27-java-input-resolution.md).

The first extended Java suite passed 29/31: Stop discarded previously printed output, and the request assertion incorrectly treated local blob module loading as an external network transfer. The parent Stop handoff was corrected; the request test now permits blob loading while requiring every actual network request to be a body-free same-origin GET. Final replay passes 31/31. The failed direct-java-package experiment is retained separately; no successful baseline is inferred from that failure file.

No hard memory cap, production-origin CSP acceptance, cross-browser acceptance, full Java library compatibility or independent review of the new helper code is claimed. Generic Java runtime exception detail remains a separate usability limitation. Hash-pinned upstream assets are unchanged; no generated class files, runtime distributions or JARs were committed.

## Reproduce

On Node 24, follow the main report's asset setup, start `node src/runtime-lab/server.mjs`, then run:

```text
node workflow/scripts/verify-java-input.mjs
node workflow/scripts/run-runtime-probes.mjs
node workflow/scripts/verify-runtime-boundary.mjs workflow/evidence/runtime-feasibility/java-input-boundary-tests.json
```

The reports record exact lab/helper source hashes. The static page at http://127.0.0.1:3130 also supports manually selecting Java and supplying stdin; it is separate from the Next.js editor.

Primary references informing the adapter: [TeaVM-javac library APIs](https://github.com/konsoletyper/teavm-javac#using-as-a-library), [compiler implementation/class-library lookup](https://github.com/konsoletyper/teavm-javac/blob/master/compiler/src/main/java/org/teavm/javac/Compiler.java), [archive format](https://github.com/konsoletyper/teavm-javac/blob/master/compiler/src/main/java/org/teavm/javac/ArchiveReader.java), [class substitution policy](https://github.com/konsoletyper/teavm-javac/blob/master/compiler/src/main/java/org/teavm/javac/ClasslibSubstitutionPolicy.java). No upstream Java implementation was copied into the first-party compatibility sources; existing runtime license/provenance gates remain unchanged.
