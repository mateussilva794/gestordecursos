// Helper minimalista pra montar CSV (RFC 4180): vírgulas, aspas duplas, newline.

export type CsvCell = string | number | null | undefined | Date | boolean;

function escapeCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  let s: string;
  if (cell instanceof Date) {
    s = cell.toISOString();
  } else if (typeof cell === "boolean") {
    s = cell ? "true" : "false";
  } else {
    s = String(cell);
  }
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];
  // BOM UTF-8 ajuda o Excel a abrir com encoding correto.
  return "\ufeff" + lines.join("\n");
}

export function csvResponse(filename: string, content: string): Response {
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
