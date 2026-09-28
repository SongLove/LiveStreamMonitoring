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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnchorSchema = exports.Anchor = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Anchor = class Anchor {
};
exports.Anchor = Anchor;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Anchor.prototype, "platform", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Anchor.prototype, "platformUid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Anchor.prototype, "roomId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Anchor.prototype, "nickname", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Anchor.prototype, "avatarUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Anchor.prototype, "profileUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Anchor.prototype, "liveTitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Anchor.prototype, "coverUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'offline' }),
    __metadata("design:type", String)
], Anchor.prototype, "liveState", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Anchor.prototype, "followerCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 2 }),
    __metadata("design:type", Number)
], Anchor.prototype, "pollTier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Anchor.prototype, "lastPolledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'active' }),
    __metadata("design:type", String)
], Anchor.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Anchor.prototype, "consecutiveOffline", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Anchor.prototype, "consecutiveProbeFailed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Anchor.prototype, "lastLiveAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Anchor.prototype, "subscriberCount", void 0);
exports.Anchor = Anchor = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'anchors' })
], Anchor);
exports.AnchorSchema = mongoose_1.SchemaFactory.createForClass(Anchor);
exports.AnchorSchema.index({ platform: 1, platformUid: 1 }, { unique: true });
exports.AnchorSchema.index({ status: 1, pollTier: 1, lastPolledAt: 1 });
//# sourceMappingURL=anchor.schema.js.map