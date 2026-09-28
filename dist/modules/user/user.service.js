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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./user.schema");
let UserService = class UserService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    async findById(userId) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async getProfile(userId) {
        const user = await this.findById(userId);
        return {
            id: user.id,
            nickname: user.nickname,
            avatarUrl: user.avatarUrl,
            status: user.status,
            settings: user.settings,
            templateAuth: user.templateAuth,
            lastActiveAt: user.lastActiveAt,
        };
    }
    async updateSettings(userId, patch) {
        const user = await this.findById(userId);
        if (user.status === 'banned') {
            throw new common_1.ForbiddenException({ code: 40301, message: 'Account banned' });
        }
        user.settings = { ...user.settings, ...patch };
        await user.save();
        return user.settings;
    }
    async assertCanWrite(userId) {
        const user = await this.findById(userId);
        if (user.status === 'banned') {
            throw new common_1.ForbiddenException({ code: 40301, message: 'Account banned' });
        }
        if (user.status === 'deleting') {
            throw new common_1.ForbiddenException({ code: 40302, message: 'Account deleting' });
        }
        return user;
    }
    async setTemplateAuth(userId, templateId, status) {
        await this.userModel.updateOne({ _id: userId }, { $set: { [`templateAuth.${templateId}`]: status } });
    }
    async setTemplateAuthByOpenId(openid, templateId, status) {
        await this.userModel.updateOne({ openid }, { $set: { [`templateAuth.${templateId}`]: status } });
    }
    async findByOpenId(openid) {
        return this.userModel.findOne({ openid });
    }
    async listForAdmin(query) {
        const page = Math.max(1, query.page || 1);
        const pageSize = Math.min(100, query.pageSize || 20);
        const filter = {};
        if (query.status)
            filter.status = query.status;
        const [items, total] = await Promise.all([
            this.userModel
                .find(filter)
                .sort({ lastActiveAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            this.userModel.countDocuments(filter),
        ]);
        return { items, total, page, pageSize };
    }
    async ban(userId, banned) {
        return this.userModel.findByIdAndUpdate(userId, { status: banned ? 'banned' : 'active' }, { new: true });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UserService);
//# sourceMappingURL=user.service.js.map