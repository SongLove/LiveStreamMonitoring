"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnchorModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const anchor_schema_1 = require("./anchor.schema");
const anchor_service_1 = require("./anchor.service");
const anchor_controller_1 = require("./anchor.controller");
const crawler_module_1 = require("../crawler/crawler.module");
let AnchorModule = class AnchorModule {
};
exports.AnchorModule = AnchorModule;
exports.AnchorModule = AnchorModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: anchor_schema_1.Anchor.name, schema: anchor_schema_1.AnchorSchema }]),
            (0, common_1.forwardRef)(() => crawler_module_1.CrawlerModule),
        ],
        providers: [anchor_service_1.AnchorService],
        controllers: [anchor_controller_1.AnchorController],
        exports: [anchor_service_1.AnchorService, mongoose_1.MongooseModule],
    })
], AnchorModule);
//# sourceMappingURL=anchor.module.js.map