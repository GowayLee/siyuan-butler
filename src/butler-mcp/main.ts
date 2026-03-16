import { pathToFileURL } from "node:url";

import { createAndStartButlerMcpServer } from "./server.js";

function isMainModule(metaUrl: string): boolean {
  const entryPath = process.argv[1];

  if (entryPath === undefined) {
    return false;
  }

  return metaUrl === pathToFileURL(entryPath).href;
}

export async function runButlerMcpServer(): Promise<void> {
  await createAndStartButlerMcpServer();
}

if (isMainModule(import.meta.url)) {
  await runButlerMcpServer().catch((error: unknown) => {
    const message =
      error instanceof Error ? (error.stack ?? error.message) : String(error);

    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
