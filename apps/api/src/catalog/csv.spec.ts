import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv.js';

describe('parseCsv (RFC 4180 subset)', () => {
  it('parses plain rows with LF, CRLF and trailing newline', () => {
    expect(parseCsv('a,b\n1,2\r\n3,4\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('handles quoted fields with commas and escaped quotes', () => {
    expect(parseCsv('name,note\n"TV 55"", Smart",ok')).toEqual([
      ['name', 'note'],
      ['TV 55", Smart', 'ok'],
    ]);
  });

  it('handles newlines inside quoted fields', () => {
    expect(parseCsv('a,b\n"line1\nline2",x')).toEqual([
      ['a', 'b'],
      ['line1\nline2', 'x'],
    ]);
  });

  it('strips a UTF-8 BOM', () => {
    expect(parseCsv('\uFEFFsku,brand\n1,LG')).toEqual([
      ['sku', 'brand'],
      ['1', 'LG'],
    ]);
  });

  it('keeps empty fields', () => {
    expect(parseCsv('a,,c\n,,')).toEqual([
      ['a', '', 'c'],
      ['', '', ''],
    ]);
  });

  it('throws on an unterminated quote', () => {
    expect(() => parseCsv('a,b\n"broken,x')).toThrow(/Unterminated/);
  });
});
