import { SetMetadata } from '@nestjs/common';
import type { Role } from '@biashara/shared';

export const IS_PUBLIC_KEY = 'isPublic';
/** Mark a route as unauthenticated (e.g. healthcheck, webhooks with their own auth). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Restrict a route to the given roles. Without it, any authenticated user passes. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
