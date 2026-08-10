/**
 * Deployment service
 * Manages Cloudflare Pages deploy status and triggers
 */

import type { DeployStatus } from "../types/api";
import { createPagesClient } from "../lib/cloudflare/pages";
import { createCachePurger } from "../lib/cloudflare/cache";

export interface DeployService {
  getStatus(): Promise<DeployStatus | null>;
  triggerDeploy(): Promise<{ id: string }>;
  purgeCache(urls?: string[]): Promise<void>;
}

export function createDeployService(
  accountId: string,
  projectName: string,
  apiToken: string,
  zoneId?: string
): DeployService {
  const pages = createPagesClient({ accountId, projectName, apiToken });
  const cache = zoneId ? createCachePurger({ zoneId, apiToken }) : null;

  return {
    async getStatus(): Promise<DeployStatus | null> {
      const deployment = await pages.getLatestDeployment();
      if (!deployment) return null;

      return {
        status: deployment.latest_stage.status === "success" ? "success" :
                deployment.latest_stage.status === "failure" ? "failure" :
                deployment.latest_stage.name === "build" ? "building" : "pending",
        url: deployment.url,
        buildTime: "unknown", // Pages API doesn't expose this directly
        commit: {
          sha: deployment.short_id,
          message: "Deployment",
          author: "Xizoa CMS",
          date: deployment.created_on,
        },
        deployedAt: deployment.created_on,
      };
    },

    async triggerDeploy(): Promise<{ id: string }> {
      // Note: Direct deploy trigger via API is limited
      // Usually triggered by Git push webhook
      // This is a placeholder for manual trigger if API supports it
      throw new Error("Manual deploy trigger not implemented. Push to GitHub to trigger deploy.");
    },

    async purgeCache(urls?: string[]): Promise<void> {
      if (!cache) {
        throw new Error("Cache purging requires zone ID");
      }

      if (urls && urls.length > 0) {
        await cache.purgeUrls(urls);
      } else {
        await cache.purgeEverything();
      }
    },
  };
}
