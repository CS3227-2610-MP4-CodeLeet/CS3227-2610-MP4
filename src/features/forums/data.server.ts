import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FORUM_PAGE_SIZE, forumPost, forumThread } from './contracts';

const postFields = 'id,body,author_name,author_role,created_at';
const threadFields = `${postFields},title`;

export async function loadThreads(client: SupabaseClient, page: number) {
  const offset = (page - 1) * FORUM_PAGE_SIZE;
  const { data, error } = await client
    .from('forum_threads')
    .select(threadFields)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + FORUM_PAGE_SIZE);
  if (error) throw new Error('Unable to load discussions.');
  const rows = forumThread.array().parse(data);
  return {
    rows: rows.slice(0, FORUM_PAGE_SIZE),
    hasNext: rows.length > FORUM_PAGE_SIZE && page < 10000,
  };
}

export async function loadThread(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from('forum_threads')
    .select(threadFields)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('Unable to load discussion.');
  return data ? forumThread.parse(data) : null;
}

export async function loadReplies(
  client: SupabaseClient,
  threadId: string,
  page: number,
) {
  const offset = (page - 1) * FORUM_PAGE_SIZE;
  const { data, error } = await client
    .from('forum_replies')
    .select(postFields)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + FORUM_PAGE_SIZE);
  if (error) throw new Error('Unable to load replies.');
  const rows = forumPost.array().parse(data);
  return {
    rows: rows.slice(0, FORUM_PAGE_SIZE),
    hasNext: rows.length > FORUM_PAGE_SIZE && page < 10000,
  };
}
