import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.MP4_LOCAL_SERVICE_ROLE_KEY;
if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error(
    'Set local Supabase URL, publishable key, and MP4_LOCAL_SERVICE_ROLE_KEY in the process environment.',
  );
}

const password = `Local-MP4-${randomUUID()}!`;
const suffix = randomUUID();
const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const instructorEmail = `quota-instructor-${suffix}@example.test`;
const studentEmail = `quota-student-${suffix}@example.test`;
let instructorId;
let studentId;

try {
  instructorId = await createAccount(instructorEmail, password, 'instructor');
  studentId = await createAccount(studentEmail, password, 'student');
  const instructor = await signedInClient(instructorEmail, password);
  const student = await signedInClient(studentEmail, password);
  const assignmentId = randomUUID();
  const criterionId = randomUUID();

  const { data: assignment, error: assignmentError } = await instructor.rpc(
    'save_assignment',
    {
      p_assignment_id: null,
      p_expected_version: 0,
      p_title: `Concurrency fixture ${suffix}`,
      p_instructions: 'Synthetic local quota test.',
      p_criteria: [
        {
          id: criterionId,
          title: 'Correctness',
          description: 'Synthetic check.',
          maxScore: 10,
        },
      ],
      p_publication_status: 'published',
    },
  );
  if (assignmentError) throw assignmentError;
  const savedAssignmentId = Array.isArray(assignment)
    ? assignment[0].id
    : assignment.id;
  const { data: submission, error: submissionError } = await student.rpc(
    'submit_code',
    {
      p_assignment_id: savedAssignmentId ?? assignmentId,
      p_source: 'print(1)',
      p_request_id: randomUUID(),
    },
  );
  if (submissionError) throw submissionError;
  const submissionId = Array.isArray(submission)
    ? submission[0].id
    : submission.id;

  const results = await Promise.all(
    Array.from({ length: 12 }, () =>
      student.rpc('reserve_ai_request', {
        p_review_type: 'student_feedback',
        p_submission_id: submissionId,
      }),
    ),
  );
  const accepted = results.filter((result) => !result.error).length;
  const quotaRejected = results.filter(
    (result) => result.error?.message.includes('daily_quota_exceeded'),
  ).length;
  if (accepted !== 5 || quotaRejected !== 7) {
    throw new Error(
      `Expected 5 accepted reservations and 7 quota rejections; received ${accepted} and ${quotaRejected}.`,
    );
  }
  console.log(
    JSON.stringify({ test: 'local student quota contention', requests: 12, accepted, quotaRejected }),
  );
} finally {
  if (studentId) await admin.auth.admin.deleteUser(studentId);
  if (instructorId) await admin.auth.admin.deleteUser(instructorId);
}

async function createAccount(email, accountPassword, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: accountPassword,
    email_confirm: true,
  });
  if (error) throw error;
  if (role === 'instructor') {
    const { error: roleError } = await admin
      .from('user_roles')
      .update({ role })
      .eq('user_id', data.user.id);
    if (roleError) throw roleError;
  }
  return data.user.id;
}

async function signedInClient(email, accountPassword) {
  const client = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: accountPassword,
  });
  if (error) throw error;
  return client;
}
