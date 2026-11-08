import type { NextRequest } from 'next/server';
import { readCases } from '@/features/practice-test-authoring/routes';
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  return readCases((await params).assignmentId, 'student');
}
