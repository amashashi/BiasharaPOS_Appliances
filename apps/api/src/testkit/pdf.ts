import type { Response } from 'supertest';

/**
 * pdfkit writes text as hex glyph arrays (`<48656c6c6f> Tj`) even uncompressed;
 * with standard WinAnsi fonts the hex bytes ARE the character codes, so
 * decoding every <...> string in stream order recovers the visible text.
 */
export const pdfText = (pdf: Buffer): string =>
  (pdf.toString('latin1').match(/<([0-9a-fA-F]+)>/g) ?? [])
    .map((h) => Buffer.from(h.slice(1, -1), 'hex').toString('latin1'))
    .join('');

/** supertest .parse() collector for binary bodies (it only parses known text types). */
export const binaryParser = (res: Response, cb: (err: Error | null, body: Buffer) => void): void => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c as Buffer));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};
