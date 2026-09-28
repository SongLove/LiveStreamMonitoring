"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWechatList = normalizeWechatList;
function normalizeWechatList(value) {
    if (value == null)
        return [];
    return Array.isArray(value) ? value : [value];
}
//# sourceMappingURL=normalize.js.map