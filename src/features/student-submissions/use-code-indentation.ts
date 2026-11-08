'use client';

import { useRef, type KeyboardEvent } from 'react';
import type { AssignmentLanguage } from '@/features/student-assignments/types';
import { getIndentationEdit, type IndentationEdit } from './indentation';

function isNativeShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
  return (
    event.nativeEvent.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  );
}

function applyEdit(
  input: HTMLTextAreaElement,
  edit: IndentationEdit,
  onChange: (source: string) => void,
) {
  input.setSelectionRange(edit.from, edit.to);
  let inserted = false;
  try {
    // Native insertText retains textarea undo history in supported browsers.
    inserted = document.execCommand('insertText', false, edit.insert);
  } catch {
    /* Fall back to the standard textarea editing API. */
  }
  if (!inserted) input.setRangeText(edit.insert, edit.from, edit.to, 'end');
  onChange(input.value);
  input.setSelectionRange(edit.start, edit.end);
  input.dispatchEvent(new Event('scroll'));
}

export function useCodeIndentation(
  language: AssignmentLanguage,
  onChange: (source: string) => void,
) {
  const focusExit = useRef(false);
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isNativeShortcut(event)) return;
    if (event.key === 'Escape') {
      focusExit.current = true;
      return;
    }
    if (event.key === 'Tab' && focusExit.current) {
      focusExit.current = false;
      return;
    }
    focusExit.current = false;
    const input = event.currentTarget;
    const edit = getIndentationEdit({
      source: input.value,
      start: input.selectionStart,
      end: input.selectionEnd,
      key: event.key,
      shift: event.shiftKey,
      language,
    });
    if (!edit) return;
    event.preventDefault();
    const length =
      input.value.length - (edit.to - edit.from) + edit.insert.length;
    if (input.maxLength >= 0 && length > input.maxLength) return;
    if (edit.insert === input.value.slice(edit.from, edit.to)) return;
    applyEdit(input, edit, onChange);
  }
  return {
    onKeyDown,
    onBlur: () => {
      focusExit.current = false;
    },
  };
}
