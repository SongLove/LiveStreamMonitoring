import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Default deny when no roles metadata
    if (!required || required.length === 0) {
      throw new ForbiddenException('No role permission configured');
    }
    const req = context.switchToHttp().getRequest();
    const roles: string[] = req.user?.roles || [];
    if (roles.includes('super_admin')) return true;
    const ok = required.some((r) => roles.includes(r));
    if (!ok) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
