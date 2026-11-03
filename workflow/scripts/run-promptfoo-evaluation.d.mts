export function buildRunPlan(
  mode: string,
  env?: Record<string, string | undefined>,
): {
  args: string[];
  env: Record<string, string | undefined>;
  error?: string;
};
