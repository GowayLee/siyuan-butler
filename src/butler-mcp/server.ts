import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { listButlerCapabilities } from "../application/index.js";

export interface ButlerMcpServerOptions {
  name?: string;
  version?: string;
  instructions?: string;
}

const DEFAULT_SERVER_NAME = "siyuan-butler";
const DEFAULT_SERVER_VERSION = "0.1.0";

function buildDefaultInstructions(): string {
  const capabilityIds = listButlerCapabilities().map(
    (capability) => capability.capability_id,
  );

  return [
    "SiYuan Butler MCP runtime skeleton.",
    "It exists to host PKM-oriented capabilities behind a review-before-write boundary.",
    `Planned capability surface: ${capabilityIds.join(", ")}.`,
  ].join(" ");
}

export function createButlerMcpServer(
  options: ButlerMcpServerOptions = {},
): McpServer {
  return new McpServer(
    {
      name: options.name ?? DEFAULT_SERVER_NAME,
      version: options.version ?? DEFAULT_SERVER_VERSION,
    },
    {
      instructions: options.instructions ?? buildDefaultInstructions(),
      capabilities: {},
    },
  );
}

export async function startButlerMcpServer(
  server: McpServer,
  transport: StdioServerTransport = new StdioServerTransport(),
): Promise<void> {
  await server.connect(transport);
}

export async function createAndStartButlerMcpServer(
  options: ButlerMcpServerOptions = {},
): Promise<McpServer> {
  const server = createButlerMcpServer(options);

  await startButlerMcpServer(server);

  return server;
}
