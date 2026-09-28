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
exports.UserAnchorCategorySchema = exports.UserAnchorCategory = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let UserAnchorCategory = class UserAnchorCategory {
};
exports.UserAnchorCategory = UserAnchorCategory;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], UserAnchorCategory.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], UserAnchorCategory.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '#4A90E2' }),
    __metadata("design:type", String)
], UserAnchorCategory.prototype, "color", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], UserAnchorCategory.prototype, "icon", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], UserAnchorCategory.prototype, "sortOrder", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], UserAnchorCategory.prototype, "deleted", void 0);
exports.UserAnchorCategory = UserAnchorCategory = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'user_anchor_categories' })
], UserAnchorCategory);
exports.UserAnchorCategorySchema = mongoose_1.SchemaFactory.createForClass(UserAnchorCategory);
exports.UserAnchorCategorySchema.index({ userId: 1, name: 1 }, { unique: true });
exports.UserAnchorCategorySchema.index({ userId: 1, sortOrder: 1 });
//# sourceMappingURL=category.schema.js.map