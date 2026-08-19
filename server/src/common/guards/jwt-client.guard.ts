import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtClientGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization as string | undefined;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing client token');
    }
    try {
      const payload = this.jwt.verify(auth.slice(7), {
        secret: this.config.get<string>('jwt.clientSecret'),
      });
      if (payload.typ && payload.typ !== 'client') {
        throw new UnauthorizedException('Invalid token type');
      }
      req.user = { userId: payload.sub, openid: payload.openid, typ: 'client' };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid client token');
    }
  }
}
