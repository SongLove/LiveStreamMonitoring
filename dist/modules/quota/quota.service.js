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
var QuotaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotaService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const quota_ledger_schema_1 = require("./quota-ledger.schema");
const user_quota_schema_1 = require("./user-quota.schema");
let QuotaService = QuotaService_1 = class QuotaService {
    constructor(ledgerModel, quotaModel, config) {
        this.ledgerModel = ledgerModel;
        this.quotaModel = quotaModel;
        this.config = config;
        this.logger = new common_1.Logger(QuotaService_1.name);
    }
    async getSnapshot(userId) {
        const maxBalance = this.config.get('quota.maxBalance') || 200;
        let snap = await this.quotaModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) });
        if (!snap) {
            snap = await this.quotaModel.create({
                userId: new mongoose_2.Types.ObjectId(userId),
                balance: 0,
                maxBalance,
            });
        }
        return { balance: snap.balance, maxBalance: snap.maxBalance };
    }
    async refreshReadOnly(userId) {
        return this.getSnapshot(userId);
    }
    rejectClientGrant() {
        throw new common_1.BadRequestException({
            code: 40010,
            message: 'Quota grant only via WeChat subscribe callback',
        });
    }
    async grantFromWechatCallback(params) {
        const maxBalance = this.config.get('quota.maxBalance') || 200;
        const userOid = new mongoose_2.Types.ObjectId(params.userId);
        try {
            await this.ledgerModel.create({
                userId: userOid,
                type: 'grant',
                amount: 1,
                idempotencyKey: params.idempotencyKey,
                templateId: params.templateId,
                reason: 'wechat_subscribe_accept',
                meta: params.meta || {},
            });
        }
        catch (err) {
            if (err?.code === 11000) {
                const snap = await this.getSnapshot(params.userId);
                return { granted: false, balance: snap.balance };
            }
            throw err;
        }
        try {
            const snap = await this.quotaModel.findOneAndUpdate({ userId: userOid }, [
                {
                    $set: {
                        balance: {
                            $min: [
                                maxBalance,
                                { $add: [{ $ifNull: ['$balance', 0] }, 1] },
                            ],
                        },
                        maxBalance,
                    },
                },
            ], { upsert: true, new: true, updatePipeline: true });
            return { granted: true, balance: snap?.balance ?? 0 };
        }
        catch (err) {
            await this.ledgerModel
                .deleteOne({ idempotencyKey: params.idempotencyKey })
                .catch(() => undefined);
            throw err;
        }
    }
    async deduct(userId, idempotencyKey, reason = 'notify_send') {
        const userOid = new mongoose_2.Types.ObjectId(userId);
        try {
            await this.ledgerModel.create({
                userId: userOid,
                type: 'deduct',
                amount: -1,
                idempotencyKey,
                reason,
            });
        }
        catch (err) {
            if (err?.code === 11000)
                return true;
            throw err;
        }
        const updated = await this.quotaModel.findOneAndUpdate({ userId: userOid, balance: { $gt: 0 } }, { $inc: { balance: -1 } }, { new: true });
        if (!updated) {
            await this.ledgerModel.deleteOne({ idempotencyKey }).catch(() => undefined);
            return false;
        }
        return true;
    }
    async refund(userId, idempotencyKey, reason = 'notify_refund') {
        const maxBalance = this.config.get('quota.maxBalance') || 200;
        const userOid = new mongoose_2.Types.ObjectId(userId);
        try {
            await this.ledgerModel.create({
                userId: userOid,
                type: 'refund',
                amount: 1,
                idempotencyKey,
                reason,
            });
        }
        catch (err) {
            if (err?.code === 11000)
                return;
            throw err;
        }
        await this.quotaModel.findOneAndUpdate({ userId: userOid }, [
            {
                $set: {
                    balance: {
                        $min: [maxBalance, { $add: [{ $ifNull: ['$balance', 0] }, 1] }],
                    },
                },
            },
        ], { upsert: true, updatePipeline: true });
    }
    async adjust(userId, delta, idempotencyKey, reason) {
        if (!reason?.trim()) {
            throw new common_1.BadRequestException('Reason required for quota adjust');
        }
        const maxBalance = this.config.get('quota.maxBalance') || 200;
        const userOid = new mongoose_2.Types.ObjectId(userId);
        try {
            await this.ledgerModel.create({
                userId: userOid,
                type: 'adjust',
                amount: delta,
                idempotencyKey,
                reason,
            });
        }
        catch (err) {
            if (err?.code === 11000) {
                return this.getSnapshot(userId);
            }
            throw err;
        }
        const snap = await this.quotaModel.findOneAndUpdate({ userId: userOid }, [
            {
                $set: {
                    balance: {
                        $max: [
                            0,
                            {
                                $min: [
                                    maxBalance,
                                    { $add: [{ $ifNull: ['$balance', 0] }, delta] },
                                ],
                            },
                        ],
                    },
                    maxBalance,
                },
            },
        ], { upsert: true, new: true, updatePipeline: true });
        return { balance: snap?.balance ?? 0 };
    }
    async listLedger(userId, limit = 20) {
        return this.ledgerModel
            .find({ userId: new mongoose_2.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
};
exports.QuotaService = QuotaService;
exports.QuotaService = QuotaService = QuotaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(quota_ledger_schema_1.QuotaLedger.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_quota_schema_1.UserQuota.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService])
], QuotaService);
//# sourceMappingURL=quota.service.js.map