import { RawHadeethEncRow } from "./ExcelReader";

export interface ImportResult {
  imported: number;
  errors: string[];
}

export async function importRows(rows: RawHadeethEncRow[]): Promise<ImportResult> {
  return {
    imported: rows.length,
    errors: [],
  };
}
