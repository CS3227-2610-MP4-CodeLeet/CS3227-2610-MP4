import 'server-only';
import { notFound } from 'next/navigation';
import {
  isAssignmentPreviewEnabled,
  publishedDetail,
  publishedSummaries,
} from './selectors';
import type { AssignmentRecord } from './types';

// Synthetic only. This adapter is never a fallback for missing production auth.
const fixtures: readonly AssignmentRecord[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    title: 'Find the largest number',
    language: 'python',
    publication_status: 'published',
    instructions:
      'Write a Python function find_max(numbers) that returns the largest integer in a non-empty list.\n\nRequirements\n• Handle negative numbers and repeated values.\n• Do not modify the input list.\n• Do not use the built-in max function.\n\nExample\nInput: [-7, -2, -9]\nExpected return value: -2',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    title: 'Count the vowels',
    language: 'java',
    publication_status: 'published',
    instructions:
      'Write a Java program in a single Main class that reads one line of text and prints its number of vowels.\n\nRequirements\n• Count a, e, i, o and u, ignoring case.\n• Ignore spaces, digits and punctuation.\n• Print 0 for an empty line.\n\nExample\nInput: Hello World\nExpected output: 3',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    title: 'Draft sorting exercise',
    language: 'python',
    publication_status: 'draft',
    instructions:
      'Draft-only synthetic instructions. Must not reach student preview pages.',
  },
];

export function requireAssignmentPreview() {
  if (
    !isAssignmentPreviewEnabled(
      process.env.NODE_ENV,
      process.env.STUDENT_PREVIEW_ENABLED,
    )
  ) {
    notFound();
  }
}

export function listPreviewAssignments() {
  requireAssignmentPreview();
  return publishedSummaries(fixtures);
}

export function getPreviewAssignment(id: string) {
  requireAssignmentPreview();
  return publishedDetail(fixtures, id);
}
