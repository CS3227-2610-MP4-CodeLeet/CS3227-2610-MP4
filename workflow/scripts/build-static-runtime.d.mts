type AssetManifest = { assets: Record<string, unknown>[] };

export function buildStaticRunner(options?: {
  repositoryRoot?: string;
  outputDirectory?: string;
  environment?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  assetManifest?: AssetManifest;
}): Promise<string>;
