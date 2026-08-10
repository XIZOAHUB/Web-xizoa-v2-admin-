/**
 * Cloudflare cache purge utilities
 */

export interface CachePurgeConfig {
  zoneId: string;
  apiToken: string;
}

export function createCachePurger(config: CachePurgeConfig) {
  return {
    async purgeEverything(): Promise<void> {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/purge_cache`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ purge_everything: true }),
        }
      );

      if (!response.ok) {
        throw new Error(`Cache purge failed: ${response.status}`);
      }
    },

    async purgeUrls(urls: string[]): Promise<void> {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/purge_cache`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ files: urls }),
        }
      );

      if (!response.ok) {
        throw new Error(`Cache purge failed: ${response.status}`);
      }
    },
  };
}
