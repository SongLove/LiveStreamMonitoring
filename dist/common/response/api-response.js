"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.fail = fail;
function ok(data, message = 'ok', traceId) {
    return { code: 0, message, data, traceId };
}
function fail(code, message, data = null, traceId) {
    return { code, message, data, traceId };
}
//# sourceMappingURL=api-response.js.map