export function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function toToolResult(
  summary: string,
  structuredContent: Record<string, unknown>,
) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${summary}\n\n${pretty(structuredContent)}`,
      },
    ],
    structuredContent,
  };
}
