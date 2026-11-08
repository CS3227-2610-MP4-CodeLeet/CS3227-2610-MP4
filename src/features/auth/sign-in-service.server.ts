import 'server-only';
import { createHmac, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { SignInInput } from './sign-in-contracts';

type RpcClient = {
  rpc: (
    name: string,
    args: Record<string, string>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};
type PasswordClient = {
  auth: {
    signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => PromiseLike<{
      data: { user?: unknown; session?: unknown };
      error: { status?: number } | null;
    }>;
  };
};
type Dependencies = {
  metadata: RpcClient;
  secret: string;
  getPasswordClient: () => Promise<PasswordClient>;
  getDummyClient: () => PasswordClient;
};
export type SignInResult =
  | { kind: 'success' | 'credentials' | 'unavailable' }
  | { kind: 'limited'; retryAfter: number };
const quotaSchema = z
  .object({
    allowed: z.boolean(),
    retry_after: z.number().int().min(1).max(60),
  })
  .strict();

async function rpcData(
  client: RpcClient,
  name: string,
  args: Record<string, string>,
) {
  const result = await client.rpc(name, args);
  if (result.error) {
    console.error(`Sign-in RPC '${name}' failed:`, result.error);
    throw new Error('Sign-in dependency unavailable');
  }
  return result.data;
}

async function reserve(input: SignInInput, deps: Dependencies) {
  const value = await rpcData(deps.metadata, 'normalize_login_identifier', {
    p_identifier: input.identifier,
  });
  const normalized = z.string().min(1).max(512).parse(value);
  const fingerprint = createHmac('sha256', deps.secret)
    .update(normalized)
    .digest('hex');
  return quotaSchema.parse(
    await rpcData(deps.metadata, 'reserve_login_attempt', {
      p_fingerprint: fingerprint,
    }),
  );
}

function credentialFailure(
  error: { status?: number } | null,
): SignInResult | null {
  if (error?.status === 429) return { kind: 'limited', retryAfter: 60 };
  if (error && (error.status ?? 500) >= 500) {
    console.error('Supabase signInWithPassword upstream error >= 500:', error);
    return { kind: 'unavailable' };
  }
  return error ? { kind: 'credentials' } : null;
}
async function authenticate(
  email: string,
  password: string,
  deps: Dependencies,
): Promise<SignInResult> {
  const client = await deps.getPasswordClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  return (
    credentialFailure(error) ?? {
      kind: data.user && data.session ? 'success' : 'credentials',
    }
  );
}

export async function performSignIn(
  input: SignInInput,
  deps: Dependencies,
): Promise<SignInResult> {
  try {
    const quota = await reserve(input, deps);
    if (!quota.allowed)
      return { kind: 'limited', retryAfter: quota.retry_after };
    const email = input.identifier.includes('@')
      ? input.identifier
      : z
          .string()
          .nullable()
          .parse(
            await rpcData(deps.metadata, 'resolve_login_email', {
              p_username: input.identifier,
            }),
          );
    if (!email) {
      // Stateless client: even an unexpected dummy success can never set app cookies.
      const { error } = await deps.getDummyClient().auth.signInWithPassword({
        email: `${randomUUID()}@signin.invalid`,
        password: input.password,
      });
      return credentialFailure(error) ?? { kind: 'credentials' };
    }
    return await authenticate(email, input.password, deps);
  } catch (error) {
    console.error('performSignIn caught error:', error);
    return { kind: 'unavailable' };
  }
}
