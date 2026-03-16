export function buildDailyNoteHPath(prefix: string, journalDate: string): string {
  if (prefix === "/") {
    return `/${journalDate}`;
  }

  return `${prefix}/${journalDate}`;
}
