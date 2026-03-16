import assert from "node:assert/strict";

import { SiyuanButlerAdapter } from "../../src/adapter/siyuan/adapter.js";
import { SiyuanClient } from "../../src/adapter/siyuan/client.js";
import { loadSiyuanButlerAdapterConfigFromEnv } from "../../src/adapter/siyuan/config.js";
import type { ButlerMcpRuntimeContext } from "../../src/butler-mcp/runtime/context.js";

export interface ExpectedSiyuanRequest {
  path: string;
  body?: Record<string, unknown>;
  data?: unknown;
  payload?: unknown;
  status?: number;
}

export interface RecordedSiyuanRequest {
  path: string;
  body: unknown;
  method: string | undefined;
}

const DEFAULT_ENV: NodeJS.ProcessEnv = {
  SIYUAN_URL: "http://mock-siyuan.local",
  SIYUAN_NOTEBOOK: "daily-notebook",
  SIYUAN_DAILY_NOTE_HPATH_PREFIX: "/daily",
  SIYUAN_SPARKLES_SECTION_LABEL: "Sparkles",
  SIYUAN_JOURNAL_BODY_SECTION_LABEL: "Journal Body",
};

export function createMockButlerContext(
  expectedRequests: ExpectedSiyuanRequest[],
  envOverrides: NodeJS.ProcessEnv = {},
): {
  context: ButlerMcpRuntimeContext;
  requests: RecordedSiyuanRequest[];
  assertAllRequestsHandled: () => void;
} {
  const env = {
    ...DEFAULT_ENV,
    ...envOverrides,
  };
  const config = loadSiyuanButlerAdapterConfigFromEnv(env);
  const pendingRequests = [...expectedRequests];
  const requests: RecordedSiyuanRequest[] = [];

  const fetchImpl: typeof fetch = async (input, init) => {
    const nextExpected = pendingRequests.shift();
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const url = new URL(requestUrl);
    const bodyText = typeof init?.body === "string" ? init.body : undefined;
    const body = bodyText === undefined ? undefined : JSON.parse(bodyText);

    if (nextExpected === undefined) {
      throw new Error(`Unexpected SiYuan request: ${url.pathname}`);
    }

    assert.equal(init?.method, "POST");
    assert.equal(url.pathname, nextExpected.path);

    if (nextExpected.body !== undefined) {
      assert.deepEqual(body, nextExpected.body);
    }

    requests.push({
      path: url.pathname,
      body,
      method: init?.method,
    });

    const payload = nextExpected.payload ?? {
      code: 0,
      msg: "",
      data: nextExpected.data ?? null,
    };

    return new Response(JSON.stringify(payload), {
      status: nextExpected.status ?? 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const client = new SiyuanClient(config, { fetch_impl: fetchImpl });
  const adapter = new SiyuanButlerAdapter(config, client);

  return {
    context: { adapter },
    requests,
    assertAllRequestsHandled() {
      assert.equal(
        pendingRequests.length,
        0,
        `Unconsumed SiYuan requests: ${pendingRequests
          .map((request) => request.path)
          .join(", ")}`,
      );
    },
  };
}
