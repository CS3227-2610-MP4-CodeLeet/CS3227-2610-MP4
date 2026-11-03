// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForumForm } from './forum-form';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('forum post form', () => {
  it('creates a thread and navigates to its returned id', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ post: { threadId: 'thread-1' } }), {
        status: 201,
      }),
    );
    vi.stubGlobal('fetch', fetch);
    render(<ForumForm courseId="f0300000-0000-4000-8000-000000000020" />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'A useful question' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'How does this loop behave?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create discussion' }));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
    const payload = JSON.parse(fetch.mock.calls[0][1].body as string);
    expect(payload).toMatchObject({
      title: 'A useful question',
      body: 'How does this loop behave?',
      courseId: 'f0300000-0000-4000-8000-000000000020',
    });
    expect(payload.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(router.push).toHaveBeenCalledWith(
      '/forums/thread-1?courseId=f0300000-0000-4000-8000-000000000020',
    );
    expect(router.refresh).toHaveBeenCalledOnce();
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('');
  });

  it('posts a reply against its thread and handles expired authentication', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'private' } }), {
          status: 401,
        }),
      ),
    );
    render(
      <ForumForm
        courseId="f0300000-0000-4000-8000-000000000020"
        threadId="00000000-0000-4000-8000-000000000002"
      />,
    );
    expect(screen.queryByLabelText('Title')).toBeNull();
    fireEvent.change(screen.getByLabelText('Your reply'), {
      target: { value: 'I have an answer.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Post reply' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Please sign in again',
    );
    const payload = JSON.parse(
      (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string,
    );
    expect(payload).toMatchObject({
      threadId: '00000000-0000-4000-8000-000000000002',
      courseId: 'f0300000-0000-4000-8000-000000000020',
      body: 'I have an answer.',
    });
    expect(router.push).not.toHaveBeenCalled();
  });
});
