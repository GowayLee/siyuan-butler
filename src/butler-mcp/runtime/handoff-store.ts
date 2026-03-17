import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { ReviewResult } from "../../domain/objects/review-result.js";
import type { WritePlan } from "../../domain/objects/write-plan.js";

type HandoffTokenFailureReason = "invalid-format" | "not-found" | "unreadable";

function createTokenErrorMessage(
  kind: "plan" | "review",
  reason: HandoffTokenFailureReason,
): string {
  if (reason === "invalid-format")
    return kind === "plan"
      ? "plan token 格式不正确，请原样传递 prepare 返回的 plan_token。"
      : "review token 格式不正确，请原样传递 review 返回的 review_token。";

  if (reason === "not-found")
    return kind === "plan"
      ? "未找到对应的 plan token 文件，请重新 prepare；若刚执行过上一步，也请检查 cache 根目录是否一致。"
      : "未找到对应的 review token 文件，请重新 review；若刚执行过上一步，也请检查 cache 根目录是否一致。";

  return kind === "plan"
    ? "plan token 文件不可读，请重新 prepare；若问题反复出现，请检查 cache 目录权限与一致性。"
    : "review token 文件不可读，请重新 review；若问题反复出现，请检查 cache 目录权限与一致性。";
}

function createTokenError(
  kind: "plan" | "review",
  reason: HandoffTokenFailureReason,
): Error {
  return new Error(createTokenErrorMessage(kind, reason));
}

function isNodeErrorWithCode(
  error: unknown,
  code: string,
): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === code;
}

function isValidToken(kind: "plan" | "review", token: string): boolean {
  const pattern = kind === "plan" ? /^plan_[0-9a-f-]+$/ : /^review_[0-9a-f-]+$/;

  return pattern.test(token);
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export class FileHandoffStore {
  constructor(private readonly handoffDir: string) {}

  async savePlan(writePlan: WritePlan): Promise<string> {
    const token = `plan_${randomUUID()}`;
    await writeJsonFile(this.getFilePath(token), writePlan);
    return token;
  }

  async loadPlan(token: string): Promise<WritePlan> {
    return this.loadTokenFile<WritePlan>("plan", token);
  }

  async saveReview(reviewResult: ReviewResult): Promise<string> {
    const token = `review_${randomUUID()}`;
    await writeJsonFile(this.getFilePath(token), reviewResult);
    return token;
  }

  async loadReview(token: string): Promise<ReviewResult> {
    return this.loadTokenFile<ReviewResult>("review", token);
  }

  private getFilePath(token: string): string {
    return join(this.handoffDir, `${token}.json`);
  }

  private async loadTokenFile<T>(
    kind: "plan" | "review",
    token: string,
  ): Promise<T> {
    if (!isValidToken(kind, token))
      throw createTokenError(kind, "invalid-format");

    const filePath = this.getFilePath(token);
    let file: string;

    try {
      file = await readFile(filePath, "utf8");
    } catch (error) {
      if (isNodeErrorWithCode(error, "ENOENT"))
        throw createTokenError(kind, "not-found");

      throw createTokenError(kind, "unreadable");
    }

    try {
      return JSON.parse(file) as T;
    } catch {
      throw createTokenError(kind, "unreadable");
    }
  }
}
