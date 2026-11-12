import type { NextRequest } from 'next/server';
import { readCases } from '@/features/practice-test-authoring/routes';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, context: Context) {
  return readCases((await context.params).id, 'instructor');
}
