import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
export declare class JwtClientGuard implements CanActivate {
    private readonly jwt;
    private readonly config;
    constructor(jwt: JwtService, config: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
