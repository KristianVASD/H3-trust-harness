export type ParsedCompanyRow = {
  name: string;
  address: string;
  region: string;
  sector: string;
  kvk_number?: string;
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Parse pasted plain text or CSV into company candidate rows.
 * - Line mode: one company name per non-empty line
 * - CSV mode: header row name,address,region,kvk_number,sector (or first column = name)
 */
export function parseCompanyImport(raw: string): ParsedCompanyRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!lines.length) return [];

  const looksCsv = lines.some((l) => l.includes(","));
  if (!looksCsv) {
    return lines.map((name) => ({
      name,
      address: "",
      region: "",
      sector: "",
    }));
  }

  const firstCells = splitCsvLine(lines[0]).map(normalizeHeader);
  const headerKeys = ["name", "address", "region", "kvk_number", "sector"];
  const hasHeader = firstCells.some((c) => headerKeys.includes(c));

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const colIndex = (key: string, fallback: number) => {
    if (!hasHeader) return fallback;
    const idx = firstCells.indexOf(key);
    return idx >= 0 ? idx : fallback;
  };

  const rows: ParsedCompanyRow[] = [];
  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    const name = (cells[colIndex("name", 0)] ?? "").trim();
    if (!name) continue;
    const kvk = (cells[colIndex("kvk_number", 3)] ?? "").trim();
    rows.push({
      name,
      address: (cells[colIndex("address", 1)] ?? "").trim(),
      region: (cells[colIndex("region", 2)] ?? "").trim(),
      sector: (cells[colIndex("sector", 4)] ?? "").trim(),
      kvk_number: kvk || undefined,
    });
  }
  return rows;
}
