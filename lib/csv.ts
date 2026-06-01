/**
 * Parser de CSV mínimo. Suporta campos com vírgulas/aspas dentro
 * de aspas duplas (RFC 4180 básico). Sem dependência externa.
 */

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      current += ch;
      i++;
      continue;
    }
    if (ch === ",") {
      result.push(current);
      current = "";
      i++;
      continue;
    }
    if (ch === '"' && current === "") {
      inQuotes = true;
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  result.push(current);
  return result;
}

export function parseCsv(text: string): { header: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { header: [], rows: [] };
  const header = parseCsvLine(lines[0]!).map((h) => h.trim());
  const rows = lines.slice(1).map((l) => parseCsvLine(l));
  return { header, rows };
}
