import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.MP4_E2E_SERVICE_ROLE_KEY;
if (
  !url ||
  !/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(url) ||
  !publishable ||
  !serviceKey
) {
  throw new Error('Explicit local Supabase test configuration is required.');
}
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, options);
const users = [];

async function actor() {
  const email = `forum-concurrency-${randomUUID()}@example.test`;
  const password = `Local-${randomUUID()}!`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.equal(created.error, null, 'Synthetic user creation');
  users.push(created.data.user.id);
  const client = createClient(url, publishable, options);
  const login = await client.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null, 'Synthetic sign-in');
  return client;
}

function post(client, threadId = null, requestId = randomUUID()) {
  return client.rpc('create_forum_post', {
    p_thread_id: threadId,
    p_title: threadId ? null : 'Synthetic concurrency check',
    p_body: 'Synthetic text',
    p_request_id: requestId,
  });
}

async function verifyQuota() {
  const client = await actor();
  const first = await post(client);
  assert.equal(first.error, null);
  const results = await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      post(client, index % 2 ? first.data.threadId : null),
    ),
  );
  assert.equal(results.filter((result) => !result.error).length, 9);
  assert.equal(
    results.filter((result) => result.error?.message === 'forum_rate_limited')
      .length,
    3,
  );
  console.log(
    'PASS: simultaneous mixed thread/reply writes enforce ten combined posts (one existing, nine accepted, three limited).',
  );
}

async function verifyRetries() {
  const client = await actor();
  const requestId = randomUUID();
  const results = await Promise.all(
    Array.from({ length: 8 }, () => post(client, null, requestId)),
  );
  assert.ok(results.every((result) => !result.error));
  assert.equal(new Set(results.map((result) => result.data.threadId)).size, 1);
  const replyId = randomUUID();
  const replies = await Promise.all(
    Array.from({ length: 8 }, () =>
      post(client, results[0].data.threadId, replyId),
    ),
  );
  assert.ok(replies.every((result) => !result.error));
  assert.equal(new Set(replies.map((result) => result.data.postId)).size, 1);
  console.log(
    'PASS: eight concurrent thread retries and eight reply retries each create one post.',
  );
}

try {
  await verifyQuota();
  await verifyRetries();
} finally {
  for (const id of users) {
    const deleted = await admin.auth.admin.deleteUser(id);
    assert.equal(deleted.error, null, 'Synthetic fixture cleanup');
  }
}
