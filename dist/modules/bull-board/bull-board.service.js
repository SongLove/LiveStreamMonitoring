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
var BullBoardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullBoardService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const api_1 = require("@bull-board/api");
const bullMQAdapter_1 = require("@bull-board/api/bullMQAdapter");
const express_1 = require("@bull-board/express");
const bullmq_1 = require("bullmq");
const queues_1 = require("../../common/constants/queues");
let BullBoardService = BullBoardService_1 = class BullBoardService {
    constructor(httpAdapterHost, config) {
        this.httpAdapterHost = httpAdapterHost;
        this.config = config;
        this.logger = new common_1.Logger(BullBoardService_1.name);
    }
    onModuleInit() {
        const app = this.httpAdapterHost.httpAdapter.getInstance();
        const serverAdapter = new express_1.ExpressAdapter();
        serverAdapter.setBasePath('/admin/queues');
        const redis = {
            host: this.config.get('redis.host'),
            port: this.config.get('redis.port'),
        };
        const queues = queues_1.ALL_QUEUE_NAMES.map((name) => new bullMQAdapter_1.BullMQAdapter(new bullmq_1.Queue(name, { connection: redis })));
        (0, api_1.createBullBoard)({ queues, serverAdapter });
        const token = this.config.get('bullBoard.token') || '';
        app.use('/admin/queues', (req, res, next) => {
            if (token) {
                const provided = req.headers['x-bull-board-token'] || req.query.token;
                if (provided !== token) {
                    return res.status(401).send('Unauthorized — provide x-bull-board-token or Admin network access');
                }
            }
            return next();
        });
        app.use('/admin/queues', serverAdapter.getRouter());
        this.logger.log('Bull Board mounted at /admin/queues');
    }
};
exports.BullBoardService = BullBoardService;
exports.BullBoardService = BullBoardService = BullBoardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.HttpAdapterHost,
        config_1.ConfigService])
], BullBoardService);
//# sourceMappingURL=bull-board.service.js.map