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
exports.PlatformConfigSchema = exports.PlatformConfig = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let PlatformConfig = class PlatformConfig {
};
exports.PlatformConfig = PlatformConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PlatformConfig.prototype, "platform", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PlatformConfig.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], PlatformConfig.prototype, "enabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 1 }),
    __metadata("design:type", Number)
], PlatformConfig.prototype, "priority", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], PlatformConfig.prototype, "settings", void 0);
exports.PlatformConfig = PlatformConfig = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'platform_configs' })
], PlatformConfig);
exports.PlatformConfigSchema = mongoose_1.SchemaFactory.createForClass(PlatformConfig);
exports.PlatformConfigSchema.index({ platform: 1, provider: 1 }, { unique: true });
//# sourceMappingURL=platform-config.schema.js.map