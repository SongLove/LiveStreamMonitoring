import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { UserDocument } from '../user/user.schema';
import { AdminDocument } from '../admin/admin.schema';
import { WechatService } from '../wechat/wechat.service';
export declare class AuthService {
    private readonly userModel;
    private readonly adminModel;
    private readonly wechatService;
    private readonly jwt;
    private readonly config;
    constructor(userModel: Model<UserDocument>, adminModel: Model<AdminDocument>, wechatService: WechatService, jwt: JwtService, config: ConfigService);
    clientLogin(code: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            status: import("../user/user.schema").UserStatus;
            nickname: string;
            avatarUrl: string;
        };
    }>;
    adminLogin(username: string, password: string): Promise<{
        accessToken: string;
        admin: {
            id: string;
            username: string;
            roles: import("../../common/decorators/roles.decorator").AdminRole[];
        };
    }>;
    ensureBootstrapAdmin(): Promise<void>;
}
