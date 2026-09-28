import { Model, Types } from 'mongoose';
import { UserAnchorCategory, CategoryDocument } from './category.schema';
import { SubscriptionDocument } from '../subscription/subscription.schema';
export declare class CategoryService {
    private readonly categoryModel;
    private readonly subscriptionModel;
    constructor(categoryModel: Model<CategoryDocument>, subscriptionModel: Model<SubscriptionDocument>);
    list(userId: string): Promise<(import("mongoose").Document<unknown, {}, UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    create(userId: string, data: {
        name: string;
        color?: string;
        icon?: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    update(userId: string, id: string, patch: Partial<{
        name: string;
        color: string;
        icon: string;
        sortOrder: number;
    }>): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & UserAnchorCategory & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    remove(userId: string, id: string): Promise<{
        ok: boolean;
    }>;
    assertOwned(userId: string, categoryIds: string[]): Promise<void>;
    batchAssign(userId: string, categoryId: string, subscriptionIds: string[]): Promise<{
        ok: boolean;
    }>;
}
