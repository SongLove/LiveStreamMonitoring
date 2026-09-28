import { AuthService } from './auth.service';
export declare class ClientLoginDto {
    code: string;
}
export declare class AdminLoginDto {
    username: string;
    password: string;
}
export declare class ClientLoginResponseDto {
    accessToken: string;
    userId: string;
}
export declare class AdminLoginResponseDto {
    accessToken: string;
    adminId: string;
    roles: string[];
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    clientLogin(body: ClientLoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            status: import("../user/user.schema").UserStatus;
            nickname: string;
            avatarUrl: string;
        };
    }>;
    adminLogin(body: AdminLoginDto): Promise<{
        accessToken: string;
        admin: {
            id: string;
            username: string;
            roles: import("../../common/decorators/roles.decorator").AdminRole[];
        };
    }>;
}
