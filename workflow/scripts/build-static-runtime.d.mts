type AssetManifest = { assets: Record<string, unknown>[] };

export function buildStaticRunner(options?: {
  repositoryRoot?: string;
  outputDirectory?: string;
  fetchImpl?: typeof fetch;
  assetManifest?: AssetManifest;
}): Promise<string>;
