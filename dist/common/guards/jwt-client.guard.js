"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtClientGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
let JwtClientGuard = class JwtClientGuard {
    constructor(jwt, config) {
        this.jwt = jwt;
        this.config = config;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing client token');
        }
        try {
            const payload = this.jwt.verify(auth.slice(7), {
                secret: this.config.get('jwt.clientSecret'),
            });
            if (payload.typ && payload.typ !== 'client') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            req.user = { userId: payload.sub, openid: payload.openid, typ: 'client' };
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid client token');
        }
    }
};
exports.JwtClientGuard = JwtClientGuard;
exports.JwtClientGuard = JwtClientGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], JwtClientGuard);
//# sourceMappingURL=jwt-client.guard.js.map