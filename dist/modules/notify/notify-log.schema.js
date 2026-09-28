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
exports.NotifyLogSchema = exports.NotifyLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let NotifyLog = class NotifyLog {
};
exports.NotifyLog = NotifyLog;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], NotifyLog.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], NotifyLog.prototype, "sessionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], NotifyLog.prototype, "anchorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], NotifyLog.prototype, "templateId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'pending' }),
    __metadata("design:type", String)
], NotifyLog.prototype, "state", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], NotifyLog.prototype, "skipReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], NotifyLog.prototype, "wxMsgId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], NotifyLog.prototype, "finalStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], NotifyLog.prototype, "receipt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], NotifyLog.prototype, "payload", void 0);
exports.NotifyLog = NotifyLog = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'notify_logs' })
], NotifyLog);
exports.NotifyLogSchema = mongoose_1.SchemaFactory.createForClass(NotifyLog);
exports.NotifyLogSchema.index({ userId: 1, sessionId: 1, templateId: 1 }, { unique: true });
exports.NotifyLogSchema.index({ userId: 1, createdAt: -1 });
exports.NotifyLogSchema.index({ state: 1, createdAt: -1 });
//# sourceMappingURL=notify-log.schema.js.map