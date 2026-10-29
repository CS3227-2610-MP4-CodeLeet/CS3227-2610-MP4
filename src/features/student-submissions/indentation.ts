import type { AssignmentLanguage } from '@/features/student-assignments/types';

export type IndentationEdit = {
  from: number;
  to: number;
  insert: string;
  start: number;
  end: number;
};
type EditInput = {
  source: string;
  start: number;
  end: number;
  key: string;
  language: AssignmentLanguage;
  shift?: boolean;
};
type LineChange = { at: number; remove: number; insert: string };
const indent = '    ';
const pairs: Record<string, string> = { '{': '}', '[': ']', '(': ')' };

function lineStart(source: string, position: number) {
  return position === 0 ? 0 : source.lastIndexOf('\n', position - 1) + 1;
}

// An unfinished-buffer mask, not a language parser. Preserve newlines/offsets.
function codeOnly(source: string, language: AssignmentLanguage) {
  const strings =
    language === 'python'
      ? /"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\[\s\S]|[^"\\\n])*(?:"|(?=\n)|$)|'(?:\\[\s\S]|[^'\\\n])*(?:'|(?=\n)|$)|#[^\n]*/g
      : /\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*|"""[\s\S]*?(?:"""|$)|"(?:\\[\s\S]|[^"\\\n])*(?:"|(?=\n)|$)|'(?:\\[\s\S]|[^'\\\n])*(?:'|(?=\n)|$)/g;
  return source.replace(strings, (token) => token.replace(/[^\n]/g, ' '));
}

function mapPosition(position: number, changes: LineChange[]) {
  let delta = 0;
  for (const change of changes) {
    if (position < change.at) break;
    if (position < change.at + change.remove) return change.at + delta;
    delta += change.insert.length - change.remove;
  }
  return position + delta;
}

function blockIndent(input: EditInput): IndentationEdit {
  const { source, start, end, shift } = input;
  const from = lineStart(source, start);
  const nextLine = source.indexOf('\n', Math.max(start, end - 1));
  const to = nextLine < 0 ? source.length : nextLine;
  const changes: LineChange[] = [];
  let offset = from;
  const insert = source
    .slice(from, to)
    .split('\n')
    .map((line) => {
      const remove = shift
        ? (line.match(/^(?:\t| {1,4})/)?.[0].length ?? 0)
        : 0;
      const prefix = shift ? '' : indent;
      changes.push({ at: offset, remove, insert: prefix });
      offset += line.length + 1;
      return prefix + line.slice(remove);
    })
    .join('\n');
  return {
    from,
    to,
    insert,
    start: mapPosition(start, changes),
    end: mapPosition(end, changes),
  };
}

function tabEdit(input: EditInput): IndentationEdit {
  if (input.shift || input.start !== input.end) return blockIndent(input);
  const beginning = lineStart(input.source, input.start);
  const columns = Array.from(input.source.slice(beginning, input.start)).reduce(
    (column, char) => column + (char === '\t' ? 4 - (column % 4) : 1),
    0,
  );
  const insert = ' '.repeat(4 - (columns % 4));
  const caret = input.start + insert.length;
  return { from: input.start, to: input.end, insert, start: caret, end: caret };
}

function leadingWhitespace(text: string) {
  return text.match(/^[\t ]*/)?.[0] ?? '';
}

function lineIndentContext(prefix: string, language: AssignmentLanguage) {
  const line = prefix.slice(prefix.lastIndexOf('\n') + 1);
  const masked = codeOnly(prefix, language);
  const last = masked
    .slice(masked.lastIndexOf('\n') + 1)
    .trimEnd()
    .slice(-1);
  const extra =
    pairs[last] || (language === 'python' && last === ':') ? indent : '';
  return {
    leading: leadingWhitespace(line),
    extra,
    closing: pairs[last] ?? '',
  };
}

function newlineEdit(input: EditInput): IndentationEdit {
  const { source, start, end, language } = input;
  const { leading, extra, closing } = lineIndentContext(
    source.slice(0, start),
    language,
  );
  const rest = source.slice(end);
  const whitespace = leadingWhitespace(rest);
  const paired =
    Boolean(closing) && rest.slice(whitespace.length).startsWith(closing);
  const insert = `\n${leading}${extra}${paired ? `\n${leading}` : ''}`;
  const caret = start + 1 + leading.length + extra.length;
  return {
    from: start,
    to: end + (paired ? whitespace.length : 0),
    insert,
    start: caret,
    end: caret,
  };
}

function closingBrace(input: EditInput): IndentationEdit | null {
  if (input.language !== 'java') return null;
  const from = lineStart(input.source, input.start);
  const leading = input.source.slice(from, input.start);
  if (!/^[\t ]+$/.test(leading)) return null;
  if (!codeOnly(input.source.slice(0, input.start) + '}', 'java').endsWith('}'))
    return null;
  const insert = leading.replace(/^(?:\t| {1,4})/, '') + '}';
  const caret = from + insert.length;
  return { from, to: input.end, insert, start: caret, end: caret };
}

export function getIndentationEdit(input: EditInput): IndentationEdit | null {
  if (input.key === 'Tab') return tabEdit(input);
  if (input.key === 'Enter') return newlineEdit(input);
  if (input.key === '}') return closingBrace(input);
  return null;
}
