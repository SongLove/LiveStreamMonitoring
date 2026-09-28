import { CategoryService } from './category.service';
export declare class CreateCategoryDto {
    name: string;
    color?: string;
    icon?: string;
}
export declare class BatchAssignCategoryDto {
    subscriptionIds: string[];
}
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    list(user: {
        userId: string;
    }): Promise<(import("mongoose").Document<unknown, {}, import("./category.schema").UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & import("./category.schema").UserAnchorCategory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    } & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    create(user: {
        userId: string;
    }, body: CreateCategoryDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./category.schema").UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & import("./category.schema").UserAnchorCategory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./category.schema").UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & import("./category.schema").UserAnchorCategory & {
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
    }, id: string, body: CreateCategoryDto): Promise<import("mongoose").Document<unknown, {}, import("mongoose").Document<unknown, {}, import("./category.schema").UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & import("./category.schema").UserAnchorCategory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    } & {
        id: string;
    }, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").Document<unknown, {}, import("./category.schema").UserAnchorCategory, {}, import("mongoose").DefaultSchemaOptions> & import("./category.schema").UserAnchorCategory & {
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
    batchAssign(user: {
        userId: string;
    }, id: string, body: BatchAssignCategoryDto): Promise<{
        ok: boolean;
    }>;
}
