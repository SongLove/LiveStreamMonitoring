"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const live_session_schema_1 = require("./live-session.schema");
const anchor_schema_1 = require("../anchor/anchor.schema");
const live_service_1 = require("./live.service");
const live_controller_1 = require("./live.controller");
const queues_1 = require("../../common/constants/queues");
let LiveModule = class LiveModule {
};
exports.LiveModule = LiveModule;
exports.LiveModule = LiveModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: live_session_schema_1.LiveSession.name, schema: live_session_schema_1.LiveSessionSchema },
                { name: anchor_schema_1.Anchor.name, schema: anchor_schema_1.AnchorSchema },
            ]),
            bullmq_1.BullModule.registerQueue({ name: queues_1.QUEUE_NAMES.NOTIFY_DISPATCH }, { name: queues_1.QUEUE_NAMES.POLL_CONFIRM }),
        ],
        providers: [live_service_1.LiveService],
        controllers: [live_controller_1.LiveController],
        exports: [live_service_1.LiveService, mongoose_1.MongooseModule],
    })
], LiveModule);
//# sourceMappingURL=live.module.js.map