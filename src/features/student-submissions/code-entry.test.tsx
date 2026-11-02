// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeEntry } from './code-entry';
import { CodeEditor } from './code-editor';

beforeEach(() =>
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('code entry and editor', () => {
  it('requires a local check before showing validation and success feedback', () => {
    render(<CodeEntry language="python" runnerOrigin={null} />);
    const editor = screen.getByLabelText('Python source code');
    expect(
      screen.getByText('Your code is not saved. Submission is not connected.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Check code' }));
    expect(screen.getByRole('alert').textContent).toBe(
      'Enter some code before checking it.',
    );
    fireEvent.change(editor, { target: { value: 'print(1)' } });
    expect(screen.getByRole('status').textContent).toContain(
      'does not execute or submit code',
    );
    expect(
      (screen.getByRole('button', { name: 'Submit code' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('keeps oversized source editable and reports the byte limit', () => {
    render(<CodeEntry language="java" runnerOrigin={null} />);
    fireEvent.change(screen.getByLabelText('Java source code'), {
      target: { value: 'x'.repeat(32_769) },
    });
    expect(screen.getByRole('alert').textContent).toContain('32 KiB limit');
    expect(
      screen.getByLabelText('Java source code').getAttribute('aria-invalid'),
    ).toBe('true');
    expect(screen.getByTestId('source-highlight').textContent).toContain(
      'x'.repeat(100),
    );
  });

  it('indents a selected line on Tab and leaves native modified shortcuts alone', () => {
    const onChange = vi.fn();
    render(
      <CodeEditor language="python" source="print(1)" onChange={onChange} />,
    );
    const editor = screen.getByLabelText(
      'Python source code',
    ) as HTMLTextAreaElement;
    editor.setSelectionRange(0, 0);
    fireEvent.keyDown(editor, { key: 'Tab' });
    expect(onChange).toHaveBeenCalledWith('    print(1)');
    onChange.mockClear();
    fireEvent.keyDown(editor, { key: 'Tab', ctrlKey: true });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('source-line-numbers').textContent).toBe('1');
  });
});
