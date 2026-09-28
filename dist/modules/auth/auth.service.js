"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcrypt"));
const user_schema_1 = require("../user/user.schema");
const admin_schema_1 = require("../admin/admin.schema");
const wechat_service_1 = require("../wechat/wechat.service");
let AuthService = class AuthService {
    constructor(userModel, adminModel, wechatService, jwt, config) {
        this.userModel = userModel;
        this.adminModel = adminModel;
        this.wechatService = wechatService;
        this.jwt = jwt;
        this.config = config;
    }
    async clientLogin(code) {
        const { openid } = await this.wechatService.code2Session(code);
        let user = await this.userModel.findOne({ openid });
        if (!user) {
            user = await this.userModel.create({ openid, lastActiveAt: new Date() });
        }
        else {
            user.lastActiveAt = new Date();
            await user.save();
        }
        const accessToken = this.jwt.sign({ sub: user.id, openid: user.openid, typ: 'client' }, {
            secret: this.config.get('jwt.clientSecret'),
            expiresIn: this.config.get('jwt.clientExpires'),
        });
        return {
            accessToken,
            user: {
                id: user.id,
                status: user.status,
                nickname: user.nickname,
                avatarUrl: user.avatarUrl,
            },
        };
    }
    async adminLogin(username, password) {
        await this.ensureBootstrapAdmin();
        const admin = await this.adminModel.findOne({ username });
        if (!admin || !admin.enabled) {
            throw new Error('Invalid credentials');
        }
        const ok = await bcrypt.compare(password, admin.passwordHash);
        if (!ok)
            throw new Error('Invalid credentials');
        const accessToken = this.jwt.sign({
            sub: admin.id,
            username: admin.username,
            roles: admin.roles,
            typ: 'admin',
        }, {
            secret: this.config.get('jwt.adminSecret'),
            expiresIn: this.config.get('jwt.adminExpires'),
        });
        return {
            accessToken,
            admin: { id: admin.id, username: admin.username, roles: admin.roles },
        };
    }
    async ensureBootstrapAdmin() {
        const count = await this.adminModel.countDocuments();
        if (count > 0)
            return;
        const username = this.config.get('admin.bootstrapUsername') || 'admin';
        const password = this.config.get('admin.bootstrapPassword') || 'admin123456';
        const passwordHash = await bcrypt.hash(password, 10);
        await this.adminModel.create({
            username,
            passwordHash,
            roles: ['super_admin'],
            enabled: true,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(admin_schema_1.Admin.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        wechat_service_1.WechatService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map