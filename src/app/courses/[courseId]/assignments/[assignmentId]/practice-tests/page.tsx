import { redirect } from 'next/navigation';

export default async function PracticeTestsPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId, assignmentId } = await params;
  redirect(`/courses/${courseId}/assignments/${assignmentId}/edit`);
}
