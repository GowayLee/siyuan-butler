import type { SiyuanConnectionConfig } from "./config.js";
import type {
  SiyuanApiResponse,
  SiyuanBlockKramdown,
  SiyuanChildBlock,
  SiyuanDocPath,
  SiyuanOperationBatch,
} from "./types.js";

export interface SiyuanClientOptions {
  fetch_impl?: typeof fetch;
}

export class SiyuanClient {
  private readonly baseUrl: string;

  private readonly token?: string;

  private readonly fetchImpl: typeof fetch;

  constructor(
    config: SiyuanConnectionConfig,
    options: SiyuanClientOptions = {},
  ) {
    this.baseUrl = config.base_url;
    this.token = config.token;
    this.fetchImpl = options.fetch_impl ?? fetch;
  }

  async getIDsByHPath(path: string, notebook: string): Promise<string[]> {
    const response = await this.post<string[]>("/api/filetree/getIDsByHPath", {
      path,
      notebook,
    });

    return response.data;
  }

  async getChildBlocks(id: string): Promise<SiyuanChildBlock[]> {
    const response = await this.post<SiyuanChildBlock[]>("/api/block/getChildBlocks", {
      id,
    });

    return response.data;
  }

  async getBlockKramdown(id: string): Promise<SiyuanBlockKramdown> {
    const response = await this.post<SiyuanBlockKramdown>(
      "/api/block/getBlockKramdown",
      { id },
    );

    return response.data;
  }

  async getBlockAttrs(id: string): Promise<Record<string, string>> {
    const response = await this.post<Record<string, string>>(
      "/api/attr/getBlockAttrs",
      { id },
    );

    return response.data;
  }

  async getHPathByID(id: string): Promise<string> {
    const response = await this.post<string>("/api/filetree/getHPathByID", { id });

    return response.data;
  }

  async getPathByID(id: string): Promise<SiyuanDocPath> {
    const response = await this.post<SiyuanDocPath>("/api/filetree/getPathByID", { id });

    return response.data;
  }

  async appendBlock(input: {
    parentID: string;
    data: string;
    dataType?: "markdown" | "dom";
  }): Promise<SiyuanOperationBatch[]> {
    const response = await this.post<SiyuanOperationBatch[]>("/api/block/appendBlock", {
      parentID: input.parentID,
      data: input.data,
      dataType: input.dataType ?? "markdown",
    });

    return response.data;
  }

  async updateBlock(input: {
    id: string;
    data: string;
    dataType?: "markdown" | "dom";
  }): Promise<SiyuanOperationBatch[]> {
    const response = await this.post<SiyuanOperationBatch[]>("/api/block/updateBlock", {
      id: input.id,
      data: input.data,
      dataType: input.dataType ?? "markdown",
    });

    return response.data;
  }

  async setBlockAttrs(input: {
    id: string;
    attrs: Record<string, string>;
  }): Promise<void> {
    await this.post<null>("/api/attr/setBlockAttrs", input);
  }

  private async post<T>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<SiyuanApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token !== undefined) {
      headers.Authorization = `token ${this.token}`;
    }

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`SiYuan API ${path} 返回 HTTP ${response.status}。`);
    }

    const payload = (await response.json()) as SiyuanApiResponse<T>;

    if (payload.code !== 0) {
      throw new Error(
        `SiYuan API ${path} 调用失败: ${payload.msg || `code=${payload.code}`}`,
      );
    }

    return payload;
  }
}
