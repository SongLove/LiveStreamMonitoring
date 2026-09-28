import { SubscriptionService } from './subscription.service';
export declare class CreateSubscriptionDto {
    anchorId: string;
    categoryIds?: string[];
}
export declare class PatchSubscriptionDto {
    enabled?: boolean;
    remark?: string;
    categoryIds?: string[];
    sortOrder?: number;
}
export declare class BatchSubscriptionDto {
    ids: string[];
    enabled?: boolean;
    categoryIds?: string[];
}
export declare class SubscriptionController {
    private readonly subscriptionService;
    constructor(subscriptionService: SubscriptionService);
    list(user: {
        userId: string;
    }): Promise<(import("mongoose").Document<unknown, {}, import("./subscription.schema").Subscription, {}, import("mongoose").DefaultSchemaOptions> & import("./subscription.schema").Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    add(user: {
        userId: string;
    }, body: CreateSubscriptionDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./subscription.schema").Subscription, {}, import("mongoose").DefaultSchemaOptions> & import("./subscription.schema").Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./subscription.schema").Subscription, {}, import("mongoose").DefaultSchemaOptions> & import("./subscription.schema").Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    update(user: {
        userId: string;
    }, id: string, body: PatchSubscriptionDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./subscription.schema").Subscription, {}, import("mongoose").DefaultSchemaOptions> & import("./subscription.schema").Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./subscription.schema").Subscription, {}, import("mongoose").DefaultSchemaOptions> & import("./subscription.schema").Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>>;
    remove(user: {
        userId: string;
    }, id: string): Promise<{
        ok: boolean;
    }>;
    batch(user: {
        userId: string;
    }, body: BatchSubscriptionDto): Promise<{
        ok: boolean;
    }>;
}
