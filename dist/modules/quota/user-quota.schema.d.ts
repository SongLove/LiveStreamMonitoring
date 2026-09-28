import { HydratedDocument, Types } from 'mongoose';
export type UserQuotaDocument = HydratedDocument<UserQuota>;
export declare class UserQuota {
    userId: Types.ObjectId;
    balance: number;
    maxBalance: number;
}
export declare const UserQuotaSchema: import("mongoose").Schema<UserQuota, import("mongoose").Model<UserQuota, any, any, any, any, any, UserQuota>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserQuota, import("mongoose").Document<unknown, {}, UserQuota, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<UserQuota & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserQuota, import("mongoose").Document<unknown, {}, UserQuota, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserQuota & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    balance?: import("mongoose").SchemaDefinitionProperty<number, UserQuota, import("mongoose").Document<unknown, {}, UserQuota, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserQuota & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    maxBalance?: import("mongoose").SchemaDefinitionProperty<number, UserQuota, import("mongoose").Document<unknown, {}, UserQuota, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserQuota & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, UserQuota>;
