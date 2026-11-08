import type { NextRequest } from 'next/server';
import { handleReview } from '@/lib/ai/review-route';

export function POST(request: NextRequest) {
  return handleReview(request, 'instructor');
}
