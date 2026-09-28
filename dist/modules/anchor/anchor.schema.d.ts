import { HydratedDocument } from 'mongoose';
export type AnchorDocument = HydratedDocument<Anchor>;
export type AnchorLiveState = 'offline' | 'pending_confirm' | 'live';
export type Platform = 'bilibili' | 'douyin' | 'kuaishou';
export declare class Anchor {
    platform: Platform;
    platformUid: string;
    roomId: string;
    nickname: string;
    avatarUrl: string;
    profileUrl: string;
    liveTitle: string;
    coverUrl: string;
    liveState: AnchorLiveState;
    followerCount: number;
    pollTier: number;
    lastPolledAt: Date | null;
    status: 'active' | 'paused' | 'invalid';
    consecutiveOffline: number;
    consecutiveProbeFailed: number;
    lastLiveAt: Date | null;
    subscriberCount: number;
}
export declare const AnchorSchema: import("mongoose").Schema<Anchor, import("mongoose").Model<Anchor, any, any, any, any, any, Anchor>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    platform?: import("mongoose").SchemaDefinitionProperty<Platform, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    platformUid?: import("mongoose").SchemaDefinitionProperty<string, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    roomId?: import("mongoose").SchemaDefinitionProperty<string, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    nickname?: import("mongoose").SchemaDefinitionProperty<string, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    avatarUrl?: import("mongoose").SchemaDefinitionProperty<string, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    profileUrl?: import("mongoose").SchemaDefinitionProperty<string, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    liveTitle?: import("mongoose").SchemaDefinitionProperty<string, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    coverUrl?: import("mongoose").SchemaDefinitionProperty<string, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    liveState?: import("mongoose").SchemaDefinitionProperty<AnchorLiveState, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    followerCount?: import("mongoose").SchemaDefinitionProperty<number, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    pollTier?: import("mongoose").SchemaDefinitionProperty<number, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastPolledAt?: import("mongoose").SchemaDefinitionProperty<Date | null, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<"active" | "paused" | "invalid", Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    consecutiveOffline?: import("mongoose").SchemaDefinitionProperty<number, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    consecutiveProbeFailed?: import("mongoose").SchemaDefinitionProperty<number, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    lastLiveAt?: import("mongoose").SchemaDefinitionProperty<Date | null, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    subscriberCount?: import("mongoose").SchemaDefinitionProperty<number, Anchor, import("mongoose").Document<unknown, {}, Anchor, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Anchor & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Anchor>;
