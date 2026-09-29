import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
export declare class UserService {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
    findById(userId: string): Promise<UserDocument>;
    getProfile(userId: string): Promise<{
        id: string;
        nickname: string;
        avatarUrl: string;
        status: import("./user.schema").UserStatus;
        settings: {
            notifyEnabled: boolean;
            dndEnabled: boolean;
            dndStart: string;
            dndEnd: string;
            studentMode: boolean;
            cooldownMinutes: number;
        };
        templateAuth: Record<string, "accept" | "reject" | "unknown">;
        lastActiveAt: Date;
    }>;
    updateSettings(userId: string, patch: Partial<User['settings']>): Promise<{
        notifyEnabled: boolean;
        dndEnabled: boolean;
        dndStart: string;
        dndEnd: string;
        studentMode: boolean;
        cooldownMinutes: number;
    }>;
    assertCanWrite(userId: string): Promise<import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }>;
    setTemplateAuth(userId: string, templateId: string, status: 'accept' | 'reject'): Promise<void>;
    setTemplateAuthByOpenId(openid: string, templateId: string, status: 'accept' | 'reject'): Promise<void>;
    findByOpenId(openid: string): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
    listForAdmin(query: {
        page?: number;
        pageSize?: number;
        status?: string;
    }): Promise<{
        items: (import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        } & {
            id: string;
        } & Required<{
            _id: import("mongoose").Types.ObjectId;
        }>)[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    ban(userId: string, banned: boolean): Promise<(import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, User, {}, import("mongoose").DefaultSchemaOptions> & User & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>) | null>;
}
