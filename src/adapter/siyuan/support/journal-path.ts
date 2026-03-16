function parseJournalDateParts(journalDate: string): {
  year: string;
  month: string;
  day: string;
} {
  const match = journalDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match === null) {
    throw new Error(`无法从 journal_date=${journalDate} 解析日志路径变量。`);
  }

  return {
    year: match[1],
    month: match[2],
    day: match[3],
  };
}

export function buildDailyNoteHPath(
  template: string,
  journalDate: string,
): string {
  if (template === "/") {
    return `/${journalDate}`;
  }

  const { year, month, day } = parseJournalDateParts(journalDate);

  return template
    .replaceAll("{{year}}", year)
    .replaceAll("{{month}}", month)
    .replaceAll("{{day}}", day)
    .replaceAll("{{date}}", journalDate);
}
