"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const category_schema_1 = require("./category.schema");
const subscription_schema_1 = require("../subscription/subscription.schema");
let CategoryService = class CategoryService {
    constructor(categoryModel, subscriptionModel) {
        this.categoryModel = categoryModel;
        this.subscriptionModel = subscriptionModel;
    }
    async list(userId) {
        return this.categoryModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId), deleted: false })
            .sort({ sortOrder: 1 })
            .lean();
    }
    async create(userId, data) {
        const count = await this.categoryModel.countDocuments({
            userId: new mongoose_2.Types.ObjectId(userId),
            deleted: false,
        });
        if (count >= 50)
            throw new common_1.BadRequestException('Category limit exceeded');
        try {
            return await this.categoryModel.create({
                userId: new mongoose_2.Types.ObjectId(userId),
                name: data.name.trim(),
                color: data.color || '#4A90E2',
                icon: data.icon || '',
                sortOrder: count,
            });
        }
        catch (err) {
            if (err?.code === 11000)
                throw new common_1.BadRequestException('Category name exists');
            throw err;
        }
    }
    async update(userId, id, patch) {
        const cat = await this.categoryModel.findOne({
            _id: id,
            userId: new mongoose_2.Types.ObjectId(userId),
            deleted: false,
        });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        Object.assign(cat, patch);
        await cat.save();
        return cat;
    }
    async remove(userId, id) {
        const cat = await this.categoryModel.findOne({
            _id: id,
            userId: new mongoose_2.Types.ObjectId(userId),
            deleted: false,
        });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        cat.deleted = true;
        await cat.save();
        await this.subscriptionModel.updateMany({ userId: new mongoose_2.Types.ObjectId(userId) }, { $pull: { categoryIds: cat._id } });
        return { ok: true };
    }
    async assertOwned(userId, categoryIds) {
        if (!categoryIds.length)
            return;
        const count = await this.categoryModel.countDocuments({
            _id: { $in: categoryIds.map((id) => new mongoose_2.Types.ObjectId(id)) },
            userId: new mongoose_2.Types.ObjectId(userId),
            deleted: false,
        });
        if (count !== categoryIds.length) {
            throw new common_1.ForbiddenException('Invalid category ownership');
        }
    }
    async batchAssign(userId, categoryId, subscriptionIds) {
        await this.assertOwned(userId, [categoryId]);
        const oid = new mongoose_2.Types.ObjectId(categoryId);
        await this.subscriptionModel.updateMany({
            _id: { $in: subscriptionIds.map((id) => new mongoose_2.Types.ObjectId(id)) },
            userId: new mongoose_2.Types.ObjectId(userId),
            deleted: false,
        }, { $addToSet: { categoryIds: oid } });
        return { ok: true };
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(category_schema_1.UserAnchorCategory.name)),
    __param(1, (0, mongoose_1.InjectModel)(subscription_schema_1.Subscription.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], CategoryService);
//# sourceMappingURL=category.service.js.map