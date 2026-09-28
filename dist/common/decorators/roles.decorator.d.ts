export declare const ROLES_KEY = "roles";
export type AdminRole = 'super_admin' | 'user_support' | 'content_ops' | 'ops_audit';
export declare const Roles: (...roles: AdminRole[]) => import("@nestjs/common").CustomDecorator<string>;
