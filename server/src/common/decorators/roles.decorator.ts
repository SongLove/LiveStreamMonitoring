import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type AdminRole = 'super_admin' | 'user_support' | 'content_ops' | 'ops_audit';

export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
