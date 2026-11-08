type ProviderResult = {
  output?: string;
  error?: string;
  tokenUsage?: {
    prompt?: number;
    completion?: number;
    total?: number;
  };
};

export function createPromptfooProvider(options?: Record<string, unknown>): {
  id(): string;
  callApi(
    prompt: string,
    context?: { vars?: Record<string, unknown> },
  ): Promise<ProviderResult>;
};

export default class PromptfooSoCLaaSProvider {
  id(): string;
  callApi(
    prompt: string,
    context?: { vars?: Record<string, unknown> },
    options?: Record<string, unknown>,
  ): Promise<ProviderResult>;
}
