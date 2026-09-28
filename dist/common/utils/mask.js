"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskOpenId = maskOpenId;
exports.maskSecret = maskSecret;
function maskOpenId(openid) {
    if (!openid)
        return '';
    if (openid.length <= 8)
        return '****';
    return `${openid.slice(0, 4)}****${openid.slice(-4)}`;
}
function maskSecret(value) {
    if (!value)
        return '';
    if (value.length <= 4)
        return '****';
    return `${value.slice(0, 2)}****${value.slice(-2)}`;
}
//# sourceMappingURL=mask.js.map