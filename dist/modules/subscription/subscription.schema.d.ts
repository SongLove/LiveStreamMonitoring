import { HydratedDocument, Types } from 'mongoose';
export type SubscriptionDocument = HydratedDocument<Subscription>;
export declare class Subscription {
    userId: Types.ObjectId;
    anchorId: Types.ObjectId;
    enabled: boolean;
    categoryIds: Types.ObjectId[];
    remark: string;
    sortOrder: number;
    deleted: boolean;
}
export declare const SubscriptionSchema: import("mongoose").Schema<Subscription, import("mongoose").Model<Subscription, any, any, any, any, any, Subscription>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Subscription, import("mongoose").Document<unknown, {}, Subscription, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    userId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Subscription, import("mongoose").Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    anchorId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Subscription, import("mongoose").Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    enabled?: import("mongoose").SchemaDefinitionProperty<boolean, Subscription, import("mongoose").Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    categoryIds?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId[], Subscription, import("mongoose").Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    remark?: import("mongoose").SchemaDefinitionProperty<string, Subscription, import("mongoose").Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    sortOrder?: import("mongoose").SchemaDefinitionProperty<number, Subscription, import("mongoose").Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    deleted?: import("mongoose").SchemaDefinitionProperty<boolean, Subscription, import("mongoose").Document<unknown, {}, Subscription, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Subscription & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Subscription>;
