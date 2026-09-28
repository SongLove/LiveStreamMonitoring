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
exports.LiveSessionSchema = exports.LiveSession = void 0;
exports.buildSessionKey = buildSessionKey;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let LiveSession = class LiveSession {
};
exports.LiveSession = LiveSession;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], LiveSession.prototype, "anchorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "sessionKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], LiveSession.prototype, "platform", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], LiveSession.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], LiveSession.prototype, "endedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'live' }),
    __metadata("design:type", String)
], LiveSession.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], LiveSession.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], LiveSession.prototype, "detectLatencyMs", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], LiveSession.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], LiveSession.prototype, "coverUrl", void 0);
exports.LiveSession = LiveSession = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'live_sessions' })
], LiveSession);
exports.LiveSessionSchema = mongoose_1.SchemaFactory.createForClass(LiveSession);
function buildSessionKey(anchorId, startedAt) {
    const floored = new Date(startedAt);
    floored.setSeconds(0, 0);
    return `${anchorId}:${floored.toISOString()}`;
}
//# sourceMappingURL=live-session.schema.js.map