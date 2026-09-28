"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DouyinSignatureStubProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DouyinSignatureStubProvider = void 0;
const common_1 = require("@nestjs/common");
const provider_skip_error_1 = require("./provider-skip.error");
let DouyinSignatureStubProvider = DouyinSignatureStubProvider_1 = class DouyinSignatureStubProvider {
    constructor() {
        this.name = 'douyin-signature-stub';
        this.platform = 'douyin';
        this.logger = new common_1.Logger(DouyinSignatureStubProvider_1.name);
    }
    async healthCheck() {
        return { ok: false, detail: 'signature stub not implemented (V1.1)' };
    }
    async resolve(_input) {
        throw new provider_skip_error_1.ProviderSkippedError(this.name, 'signature not implemented');
    }
    async fetchStatus(_uids) {
        this.logger.warn('signature stub invoked');
        throw new provider_skip_error_1.ProviderSkippedError(this.name, 'signature not implemented');
    }
};
exports.DouyinSignatureStubProvider = DouyinSignatureStubProvider;
exports.DouyinSignatureStubProvider = DouyinSignatureStubProvider = DouyinSignatureStubProvider_1 = __decorate([
    (0, common_1.Injectable)()
], DouyinSignatureStubProvider);
//# sourceMappingURL=douyin-signature.stub.js.map