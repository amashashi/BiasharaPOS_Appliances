import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthContext, IdentityService, Role } from '@biashara/shared';
import { IDENTITY_SERVICE } from '../platform/tokens.js';
import { IS_PUBLIC_KEY, ROLES_KEY } from './decorators.js';

/** Request with the resolved platform identity attached. */
export interface AuthedRequest extends Request {
  auth: AuthContext;
}

/**
 * Global guard: validates the platform JWT (via the IdentityService port) and
 * enforces @Roles() metadata. @Public() routes skip both. (T0.4, D-004)
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_SERVICE) private readonly identity: IdentityService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let auth: AuthContext;
    try {
      auth = await this.identity.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    req.auth = auth;

    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    if (required?.length && !required.some((r) => auth.roles.includes(r))) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
