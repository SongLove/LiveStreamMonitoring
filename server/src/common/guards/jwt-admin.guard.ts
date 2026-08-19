import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization as string | undefined;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing admin token');
    }
    try {
      const payload = this.jwt.verify(auth.slice(7), {
        secret: this.config.get<string>('jwt.adminSecret'),
      });
      if (payload.typ !== 'admin') {
        throw new UnauthorizedException('Invalid token type');
      }
      req.user = {
        adminId: payload.sub,
        username: payload.username,
        roles: payload.roles || [],
        typ: 'admin',
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid admin token');
    }
  }
}
