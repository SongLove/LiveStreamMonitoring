import { HydratedDocument } from 'mongoose';
export type PlatformConfigDocument = HydratedDocument<PlatformConfig>;
export declare class PlatformConfig {
    platform: string;
    provider: string;
    enabled: boolean;
    priority: number;
    settings: Record<string, unknown>;
}
export declare const PlatformConfigSchema: import("mongoose").Schema<PlatformConfig, import("mongoose").Model<PlatformConfig, any, any, any, any, any, PlatformConfig>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PlatformConfig, import("mongoose").Document<unknown, {}, PlatformConfig, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<PlatformConfig & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    platform?: import("mongoose").SchemaDefinitionProperty<string, PlatformConfig, import("mongoose").Document<unknown, {}, PlatformConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PlatformConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    provider?: import("mongoose").SchemaDefinitionProperty<string, PlatformConfig, import("mongoose").Document<unknown, {}, PlatformConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PlatformConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    enabled?: import("mongoose").SchemaDefinitionProperty<boolean, PlatformConfig, import("mongoose").Document<unknown, {}, PlatformConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PlatformConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    priority?: import("mongoose").SchemaDefinitionProperty<number, PlatformConfig, import("mongoose").Document<unknown, {}, PlatformConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PlatformConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    settings?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, PlatformConfig, import("mongoose").Document<unknown, {}, PlatformConfig, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<PlatformConfig & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, PlatformConfig>;
