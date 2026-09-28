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
exports.SubscriptionSchema = exports.Subscription = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Subscription = class Subscription {
};
exports.Subscription = Subscription;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Subscription.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Subscription.prototype, "anchorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Subscription.prototype, "enabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], default: [] }),
    __metadata("design:type", Array)
], Subscription.prototype, "categoryIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Subscription.prototype, "remark", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Subscription.prototype, "sortOrder", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Subscription.prototype, "deleted", void 0);
exports.Subscription = Subscription = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'subscriptions' })
], Subscription);
exports.SubscriptionSchema = mongoose_1.SchemaFactory.createForClass(Subscription);
exports.SubscriptionSchema.index({ userId: 1, anchorId: 1 }, { unique: true });
exports.SubscriptionSchema.index({ anchorId: 1, enabled: 1 });
exports.SubscriptionSchema.index({ userId: 1, enabled: 1, sortOrder: 1 });
//# sourceMappingURL=subscription.schema.js.map