import 'server-only';
import { z } from 'zod';

const providerResponseSchema = z
  .object({
    choices: z
      .array(
        z
          .object({ message: z.object({ content: z.string() }).passthrough() })
          .passthrough(),
      )
      .min(1),
    usage: z
      .object({
        prompt_tokens: z.number().int().nonnegative().optional(),
        completion_tokens: z.number().int().nonnegative().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export class SoCLaaSError extends Error {
  constructor(
    readonly category:
      'unavailable' | 'timeout' | 'provider_error' | 'malformed_response',
  ) {
    super(category);
  }
}

function getProviderConfig() {
  const enabled = process.env.SOCLAAS_AI_ENABLED === 'true';
  const baseUrl = process.env.SOCLAAS_BASE_URL?.trim();
  const apiKey = process.env.SOCLAAS_API_KEY?.trim();
  const model = process.env.SOCLAAS_MODEL?.trim();
  if (!enabled || !baseUrl || !apiKey || !model)
    throw new SoCLaaSError('unavailable');
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey, model };
}

export async function requestSoCLaaS(messages: {
  system: string;
  user: string;
}) {
  const config = getProviderConfig();
  const endpoint = config.baseUrl.endsWith('/v1')
    ? `${config.baseUrl}/chat/completions`
    : `${config.baseUrl}/v1/chat/completions`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: messages.system },
          { role: 'user', content: messages.user },
        ],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30_000),
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError')
      throw new SoCLaaSError('timeout');
    throw new SoCLaaSError('provider_error');
  }
  if (!response.ok) throw new SoCLaaSError('provider_error');
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new SoCLaaSError('malformed_response');
  }
  const parsed = providerResponseSchema.safeParse(raw);
  if (!parsed.success) throw new SoCLaaSError('malformed_response');
  return {
    content: parsed.data.choices[0].message.content,
    model: config.model,
    inputTokens: parsed.data.usage?.prompt_tokens,
    outputTokens: parsed.data.usage?.completion_tokens,
  };
}
