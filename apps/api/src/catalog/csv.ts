/**
 * Minimal RFC 4180 CSV parser — quoted fields, escaped quotes (""),
 * CR/LF/CRLF line endings, UTF-8 BOM. Hand-rolled to keep the dependency
 * surface at zero (ARCHITECTURE.md: "every dependency is a liability").
 */
export function parseCsv(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // strip BOM
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  const endField = (): void => {
    row.push(field);
    field = '';
  };
  const endRow = (): void => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else if (ch === '"' && field === '') {
      inQuotes = true;
      i++;
    } else if (ch === ',') {
      endField();
      i++;
    } else if (ch === '\r') {
      endRow();
      i += src[i + 1] === '\n' ? 2 : 1;
    } else if (ch === '\n') {
      endRow();
      i++;
    } else {
      field += ch;
      i++;
    }
  }
  if (inQuotes) throw new Error('Unterminated quoted field in CSV');
  if (field !== '' || row.length > 0) endRow();
  return rows;
}
