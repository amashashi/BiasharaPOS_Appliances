import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AuthContext, IdentityService, Role } from '@biashara/shared';

const b64url = (buf: Buffer): string =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Stub identity: verifies HS256 JWTs signed with a shared test secret.
 * Token claims: sub (userId), mid (merchantId), name, roles[], exp.
 * The real adapter (M5) validates platform-issued tokens instead; the
 * AuthContext shape is identical, so consumers never change.
 */
export class StubIdentityService implements IdentityService {
  constructor(private readonly secret = process.env.STUB_JWT_SECRET ?? 'biashara-dev-secret') {}

  /** Dev/test helper: mint a token the stub will accept. */
  sign(claims: { sub: string; mid: string; name: string; roles: Role[]; exp?: number }): string {
    const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
    const payload = b64url(
      Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, ...claims })),
    );
    const sig = b64url(createHmac('sha256', this.secret).update(`${header}.${payload}`).digest());
    return `${header}.${payload}.${sig}`;
  }

  async verifyToken(jwt: string): Promise<AuthContext> {
    const parts = jwt.split('.');
    if (parts.length !== 3) throw new Error('STUB_AUTH_MALFORMED');
    const [header, payload, sig] = parts;
    const expected = createHmac('sha256', this.secret).update(`${header}.${payload}`).digest();
    const actual = Buffer.from(sig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new Error('STUB_AUTH_BAD_SIGNATURE');
    }
    const claims = JSON.parse(Buffer.from(payload, 'base64').toString()) as {
      sub?: string;
      mid?: string;
      name?: string;
      roles?: Role[];
      exp?: number;
    };
    if (!claims.exp || claims.exp * 1000 < Date.now()) throw new Error('STUB_AUTH_EXPIRED');
    if (!claims.sub || !claims.mid || !claims.roles?.length) throw new Error('STUB_AUTH_MISSING_CLAIMS');
    return {
      userId: claims.sub,
      merchantId: claims.mid,
      displayName: claims.name ?? claims.sub,
      roles: claims.roles,
    };
  }
}
