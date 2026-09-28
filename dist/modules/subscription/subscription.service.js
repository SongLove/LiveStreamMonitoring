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
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const subscription_schema_1 = require("./subscription.schema");
const user_service_1 = require("../user/user.service");
const anchor_service_1 = require("../anchor/anchor.service");
const category_service_1 = require("../category/category.service");
let SubscriptionService = class SubscriptionService {
    constructor(subModel, userService, anchorService, categoryService) {
        this.subModel = subModel;
        this.userService = userService;
        this.anchorService = anchorService;
        this.categoryService = categoryService;
    }
    async list(userId) {
        return this.subModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId), deleted: false })
            .sort({ sortOrder: 1, createdAt: -1 })
            .lean();
    }
    async findActive(userId, anchorId) {
        return this.subModel.findOne({
            userId: new mongoose_2.Types.ObjectId(userId),
            anchorId: new mongoose_2.Types.ObjectId(anchorId),
            deleted: false,
        });
    }
    async add(userId, anchorId, categoryIds = []) {
        await this.userService.assertCanWrite(userId);
        await this.anchorService.findById(anchorId);
        await this.categoryService.assertOwned(userId, categoryIds);
        const count = await this.subModel.countDocuments({
            userId: new mongoose_2.Types.ObjectId(userId),
            deleted: false,
        });
        if (count >= 200)
            throw new common_1.BadRequestException('Subscription limit exceeded');
        const existing = await this.subModel.findOne({
            userId: new mongoose_2.Types.ObjectId(userId),
            anchorId: new mongoose_2.Types.ObjectId(anchorId),
        });
        if (existing) {
            const wasActive = !existing.deleted && existing.enabled;
            existing.deleted = false;
            existing.enabled = true;
            if (categoryIds.length) {
                existing.categoryIds = categoryIds.map((id) => new mongoose_2.Types.ObjectId(id));
            }
            await existing.save();
            if (!wasActive)
                await this.anchorService.bumpSubscriberCount(anchorId, 1);
            return existing;
        }
        const created = await this.subModel.create({
            userId: new mongoose_2.Types.ObjectId(userId),
            anchorId: new mongoose_2.Types.ObjectId(anchorId),
            enabled: true,
            categoryIds: categoryIds.map((id) => new mongoose_2.Types.ObjectId(id)),
        });
        await this.anchorService.bumpSubscriberCount(anchorId, 1);
        return created;
    }
    async update(userId, id, patch) {
        const sub = await this.subModel.findOne({
            _id: id,
            userId: new mongoose_2.Types.ObjectId(userId),
            deleted: false,
        });
        if (!sub)
            throw new common_1.NotFoundException('Subscription not found');
        if (patch.categoryIds) {
            await this.categoryService.assertOwned(userId, patch.categoryIds);
            sub.categoryIds = patch.categoryIds.map((c) => new mongoose_2.Types.ObjectId(c));
        }
        if (patch.enabled !== undefined)
            sub.enabled = patch.enabled;
        if (patch.remark !== undefined)
            sub.remark = patch.remark;
        if (patch.sortOrder !== undefined)
            sub.sortOrder = patch.sortOrder;
        await sub.save();
        return sub;
    }
    async remove(userId, id) {
        const sub = await this.subModel.findOne({
            _id: id,
            userId: new mongoose_2.Types.ObjectId(userId),
            deleted: false,
        });
        if (!sub)
            return { ok: true };
        sub.deleted = true;
        sub.enabled = false;
        await sub.save();
        await this.anchorService.bumpSubscriberCount(String(sub.anchorId), -1);
        return { ok: true };
    }
    async batch(userId, payload) {
        if (payload.ids.length > 100)
            throw new common_1.BadRequestException('Batch limit 100');
        if (payload.categoryIds) {
            await this.categoryService.assertOwned(userId, payload.categoryIds);
        }
        const update = {};
        if (payload.enabled !== undefined)
            update.enabled = payload.enabled;
        if (payload.categoryIds) {
            update.categoryIds = payload.categoryIds.map((id) => new mongoose_2.Types.ObjectId(id));
        }
        await this.subModel.updateMany({
            _id: { $in: payload.ids.map((id) => new mongoose_2.Types.ObjectId(id)) },
            userId: new mongoose_2.Types.ObjectId(userId),
            deleted: false,
        }, { $set: update });
        return { ok: true };
    }
    async listEnabledByAnchor(anchorId) {
        return this.subModel
            .find({
            anchorId: new mongoose_2.Types.ObjectId(anchorId),
            enabled: true,
            deleted: false,
        })
            .lean();
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(subscription_schema_1.Subscription.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        user_service_1.UserService,
        anchor_service_1.AnchorService,
        category_service_1.CategoryService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map