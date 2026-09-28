import { HydratedDocument, Types } from 'mongoose';
export type CategoryDocument = HydratedDocument<UserAnchorCategory>;
export declare class UserAnchorCategory {
    userId: Types.ObjectId;
    name: string;
    color: string;
    icon: string;
    sortOrder: number;
    deleted: boolean;
}
export declare const UserAnchorCategorySchema: import("mongoose").Schema<UserAnchorCategory, import("mongoose").Model<UserAnchorCategory, any, any, any, any, any, UserAnchorCategory>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserAnchorCategory, import("mongoose").Document<unknown, {}, UserAnchorCategory, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<UserAnchorCategory & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserAnchorCategory, import("mongoose").Document<unknown, {}, UserAnchorCategory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, UserAnchorCategory, import("mongoose").Document<unknown, {}, UserAnchorCategory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    color?: import("mongoose").SchemaDefinitionProperty<string, UserAnchorCategory, import("mongoose").Document<unknown, {}, UserAnchorCategory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    icon?: import("mongoose").SchemaDefinitionProperty<string, UserAnchorCategory, import("mongoose").Document<unknown, {}, UserAnchorCategory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    sortOrder?: import("mongoose").SchemaDefinitionProperty<number, UserAnchorCategory, import("mongoose").Document<unknown, {}, UserAnchorCategory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    deleted?: import("mongoose").SchemaDefinitionProperty<boolean, UserAnchorCategory, import("mongoose").Document<unknown, {}, UserAnchorCategory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, UserAnchorCategory>;
