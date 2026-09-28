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
exports.AnchorService = void 0;
exports.buildAnchorProfileUpdate = buildAnchorProfileUpdate;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const anchor_schema_1 = require("./anchor.schema");
const douyin_input_1 = require("../crawler/providers/douyin-input");
const douyin_playwright_provider_1 = require("../crawler/providers/douyin-playwright.provider");
const kuaishou_parse_1 = require("../crawler/providers/kuaishou-parse");
const crawler_service_1 = require("../crawler/crawler.service");
function buildAnchorProfileUpdate(resolved) {
    const $set = {
        nickname: resolved.nickname,
        profileUrl: resolved.profileUrl,
        roomId: resolved.roomId || '',
        status: 'active',
    };
    const $setOnInsert = {
        pollTier: 2,
        liveState: 'offline',
    };
    const avatar = (resolved.avatarUrl || '').trim();
    if (avatar)
        $set.avatarUrl = avatar;
    else
        $setOnInsert.avatarUrl = '';
    return { $set, $setOnInsert };
}
let AnchorService = class AnchorService {
    constructor(anchorModel, crawler) {
        this.anchorModel = anchorModel;
        this.crawler = crawler;
    }
    async findById(id) {
        const a = await this.anchorModel.findById(id);
        if (!a)
            throw new common_1.NotFoundException('Anchor not found');
        return a;
    }
    async search(platform, keyword) {
        const q = keyword.trim();
        if (!q)
            return [];
        let query = q;
        if (platform === 'douyin') {
            const userUrl = q.match(/douyin\.com\/user\/([^?&#/]+)/i);
            if (userUrl) {
                try {
                    query = decodeURIComponent(userUrl[1]).trim();
                }
                catch {
                    query = userUrl[1];
                }
            }
            else if (/douyin\.com\/(?:jingxuan\/)?search\//i.test(q)) {
                throw new common_1.BadRequestException('请输入抖音号（用户 ID，如 kelie329157），不要使用搜索页链接。');
            }
            if (!(0, douyin_input_1.looksLikeDouyinUserId)(query)) {
                throw new common_1.BadRequestException('请输入抖音号（如 kelie329157），不支持按昵称搜索。');
            }
            const local = await this.anchorModel
                .find({
                platform: 'douyin',
                $or: [{ platformUid: query }, { roomId: query }],
            })
                .limit(5)
                .lean();
            const complete = local.filter((d) => !(0, douyin_playwright_provider_1.isIncompleteDouyinProfile)(d));
            if (complete.length > 0)
                return complete;
            const doc = await this.resolve('douyin', query);
            return [doc.toObject()];
        }
        if (platform === 'kuaishou') {
            const query = (0, kuaishou_parse_1.extractKuaishouId)(q);
            if (!query) {
                throw new common_1.BadRequestException('请输入快手号，或直播间链接 live.kuaishou.com/u/快手号');
            }
            const local = await this.anchorModel
                .find({
                platform: 'kuaishou',
                $or: [{ platformUid: query }, { roomId: query }],
            })
                .limit(5)
                .lean();
            const complete = local.filter((d) => (d.avatarUrl || '').trim() && (d.nickname || '').trim());
            if (complete.length > 0)
                return complete;
            const doc = await this.resolve('kuaishou', query);
            return [doc.toObject()];
        }
        const local = await this.anchorModel
            .find({
            platform,
            $or: [
                { nickname: new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
                { platformUid: query },
                { roomId: query },
            ],
        })
            .limit(20)
            .lean();
        if (local.length > 0)
            return local;
        if (/^\d+$/.test(query)) {
            const doc = await this.resolve('bilibili', query);
            return [doc.toObject()];
        }
        return [];
    }
    async resolve(platform, input) {
        const resolved = await this.crawler.resolve(platform, input);
        if (platform === 'douyin' &&
            (/[\u4e00-\u9fff]/.test(resolved.platformUid) ||
                resolved.platformUid.includes('%') ||
                resolved.platformUid.includes('?'))) {
            throw new common_1.BadRequestException('抖音用户 ID 无效，请输入抖音号（如 kelie329157）');
        }
        const doc = await this.anchorModel.findOneAndUpdate({ platform, platformUid: resolved.platformUid }, buildAnchorProfileUpdate(resolved), { upsert: true, new: true });
        if (platform === 'douyin' &&
            resolved.roomId &&
            resolved.platformUid !== resolved.roomId) {
            await this.anchorModel.deleteMany({
                platform: 'douyin',
                platformUid: resolved.roomId,
                _id: { $ne: doc._id },
            });
        }
        return doc;
    }
    async recalculatePollTier(anchorId) {
        const anchor = await this.findById(anchorId);
        const count = anchor.subscriberCount || 0;
        let tier = 3;
        if (count >= 50)
            tier = 1;
        else if (count >= 10)
            tier = 2;
        if (anchor.pollTier !== tier) {
            anchor.pollTier = tier;
            await anchor.save();
        }
        return tier;
    }
    async bumpSubscriberCount(anchorId, delta) {
        await this.anchorModel.updateOne({ _id: anchorId }, { $inc: { subscriberCount: delta } });
        await this.recalculatePollTier(anchorId);
    }
    async listDue(limit = 100) {
        const now = new Date();
        return this.anchorModel
            .find({
            status: 'active',
            $or: [{ lastPolledAt: null }, { lastPolledAt: { $lte: now } }],
        })
            .sort({ pollTier: 1, lastPolledAt: 1 })
            .limit(limit);
    }
    async adminList(page = 1, pageSize = 20) {
        const [items, total] = await Promise.all([
            this.anchorModel
                .find()
                .sort({ updatedAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            this.anchorModel.countDocuments(),
        ]);
        return { items, total, page, pageSize };
    }
};
exports.AnchorService = AnchorService;
exports.AnchorService = AnchorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(anchor_schema_1.Anchor.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        crawler_service_1.CrawlerService])
], AnchorService);
//# sourceMappingURL=anchor.service.js.map