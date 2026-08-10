/**
 * Cloudflare Pages deployment API
 */

export interface PagesDeployConfig {
  accountId: string;
  projectName: string;
  apiToken: string;
}

export function createPagesClient(config: PagesDeployConfig) {
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects/${config.projectName}`;

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pages API error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as { result: T };
    return data.result;
  }

  return {
    async getDeployments(perPage = 10) {
      return request<Array<{
        id: string;
        short_id: string;
        project_name: string;
        environment: string;
        url: string;
        created_on: string;
        latest_stage: {
          name: string;
          status: string;
        };
      }>>(`/deployments?per_page=${perPage}`);
    },

    async getLatestDeployment() {
      const deployments = await this.getDeployments(1);
      return deployments[0] || null;
    },

    async triggerDeployment() {
      // Trigger via GitHub webhook or direct API
      return request<{ id: string }>("/deployments", {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
  };
}
