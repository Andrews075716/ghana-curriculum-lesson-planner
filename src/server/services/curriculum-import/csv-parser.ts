import { ValidationError } from "@/server/errors/app-error";

/**
 * Minimal RFC4180 CSV parser (quoted fields, embedded commas/newlines,
 * escaped `""` quotes). No CSV library is installed in this project, and
 * the format the admin import accepts is simple enough not to need one.
 *
 * Returns one object per data row, keyed by the (trimmed) header cell.
 */
export function parseCsv(content: string): Record<string, string>[] {
  const rows = parseCsvRows(content);
  if (rows.length === 0) return [];

  const header = rows[0].map((cell) => cell.trim());
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""));

  return dataRows.map((row, index) => {
    if (row.length !== header.length) {
      throw new ValidationError(
        `Row ${index + 2} has ${row.length} column(s), expected ${header.length}.`,
      );
    }
    const record: Record<string, string> = {};
    header.forEach((key, i) => {
      record[key] = row[i];
    });
    return record;
  });
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  // Normalize line endings so \r\n and \r behave like \n inside the parser.
  const text = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}
