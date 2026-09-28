"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const api_response_1 = require("../response/api-response");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const traceId = req.headers['x-trace-id'] || req.id;
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = status;
        let message = 'Internal server error';
        let data = null;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            code = status;
            const body = exception.getResponse();
            if (typeof body === 'string') {
                message = body;
            }
            else if (body && typeof body === 'object') {
                const obj = body;
                message = obj.message || message;
                if (Array.isArray(obj.message))
                    message = obj.message.join('; ');
                if (typeof obj.code === 'number')
                    code = obj.code;
                data = obj.data ?? null;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(exception.message, exception.stack);
        }
        res.status(status).json((0, api_response_1.fail)(code, message, data, traceId));
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=http-exception.filter.js.map