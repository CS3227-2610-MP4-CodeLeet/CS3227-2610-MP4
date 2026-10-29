'use client';

import { useId, useRef, type RefObject, type UIEvent } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import type { AssignmentLanguage } from '@/features/student-assignments/types';
import { languageLabels } from '@/features/student-assignments/types';
import { useWorkspaceTheme } from '@/features/student-assignments/workspace-theme';
import { useCodeIndentation } from './use-code-indentation';

Prism.manual = true;

type CodeEditorProps = {
  language: AssignmentLanguage;
  source: string;
  onChange: (source: string) => void;
  editorRef?: RefObject<HTMLTextAreaElement | null>;
  invalid?: boolean;
  describedBy?: string;
  maxLength?: number;
  rows?: number;
};

function SyntaxSource({
  language,
  source,
}: {
  language: AssignmentLanguage;
  source: string;
}) {
  const theme = useWorkspaceTheme();
  // Keep oversized input editable without spending resources on highlighting it.
  if (source.length > 32_768) return <>{source}</>;
  return (
    <Highlight
      prism={Prism}
      code={source}
      language={language}
      theme={theme === 'dark' ? themes.vsDark : themes.vsLight}
    >
      {({ tokens, getTokenProps }) =>
        tokens.map((line, lineIndex) => (
          <span className="code-editor-line" key={lineIndex}>
            {line.map((token, tokenIndex) => {
              const props = getTokenProps({ token });
              return (
                <span
                  key={tokenIndex}
                  className={props.className}
                  style={props.style}
                >
                  {token.content}
                </span>
              );
            })}
          </span>
        ))
      }
    </Highlight>
  );
}

export function CodeEditor({
  language,
  source,
  onChange,
  editorRef,
  invalid = false,
  describedBy,
  maxLength,
  rows = 12,
}: CodeEditorProps) {
  const gutter = useRef<HTMLPreElement>(null);
  const highlight = useRef<HTMLPreElement>(null);
  const keyboard = useCodeIndentation(language, onChange);
  const helpId = useId();
  function syncScroll(event: UIEvent<HTMLTextAreaElement>) {
    const input = event.currentTarget;
    if (gutter.current) gutter.current.scrollTop = input.scrollTop;
    if (highlight.current) {
      highlight.current.scrollTop = input.scrollTop;
      highlight.current.scrollLeft = input.scrollLeft;
    }
  }
  return (
    <div className="code-editor relative min-w-0 overflow-hidden rounded-md border bg-background text-foreground">
      <pre
        ref={gutter}
        data-testid="source-line-numbers"
        aria-hidden="true"
        className="code-editor-gutter"
      >
        {Array.from(
          { length: Math.min(source.split('\n').length, 32_769) },
          (_, index) => index + 1,
        ).join('\n')}
      </pre>
      <div className="code-editor-overlay" aria-hidden="true">
        <pre
          ref={highlight}
          data-testid="source-highlight"
          className="code-editor-highlight"
        >
          <SyntaxSource language={language} source={source} />
        </pre>
      </div>
      <textarea
        ref={editorRef}
        id="source-code"
        aria-label={`${languageLabels[language]} source code`}
        aria-invalid={invalid}
        aria-describedby={[describedBy, helpId].filter(Boolean).join(' ')}
        value={source}
        onChange={(event) => onChange(event.target.value)}
        onScroll={syncScroll}
        onKeyDown={keyboard.onKeyDown}
        onBlur={keyboard.onBlur}
        maxLength={maxLength}
        rows={rows}
        required
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        className="code-editor-input"
      />
      <span id={helpId} className="sr-only">
        Tab indents code; Shift+Tab unindents. Press Escape then Tab to move
        focus.
      </span>
    </div>
  );
}
