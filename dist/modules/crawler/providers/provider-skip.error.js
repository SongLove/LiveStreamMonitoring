"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderSkippedError = void 0;
exports.isProviderSkippedError = isProviderSkippedError;
class ProviderSkippedError extends Error {
    constructor(providerName, reason) {
        super(`[${providerName}] skipped: ${reason}`);
        this.providerName = providerName;
        this.name = 'ProviderSkippedError';
    }
}
exports.ProviderSkippedError = ProviderSkippedError;
function isProviderSkippedError(e) {
    return e instanceof ProviderSkippedError;
}
//# sourceMappingURL=provider-skip.error.js.map