function stringifyToolTextValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(" | ");
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

export function buildKeyValueToolText(
  lines: string[],
  fields: Array<[label: string, value: unknown]>,
): string {
  const renderedLines = [...lines];

  for (const [label, value] of fields) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    renderedLines.push(`${label}: ${stringifyToolTextValue(value)}`);
  }

  return renderedLines.join("\n");
}

export function toToolResult(
  text: string,
  structuredContent: Record<string, unknown>,
) {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
    structuredContent,
  };
}
