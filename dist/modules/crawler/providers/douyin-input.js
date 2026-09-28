"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDouyinUniqueId = isDouyinUniqueId;
exports.isDouyinSecUid = isDouyinSecUid;
exports.looksLikeDouyinUserId = looksLikeDouyinUserId;
exports.parseDouyinInput = parseDouyinInput;
exports.assertDouyinUserId = assertDouyinUserId;
exports.assertStableDouyinUid = assertStableDouyinUid;
const common_1 = require("@nestjs/common");
function isDouyinUniqueId(raw) {
    const s = (raw || '').trim();
    if (/^MS4wLjABAAAA/i.test(s))
        return false;
    return /^[a-zA-Z0-9._]{3,30}$/.test(s);
}
function isDouyinSecUid(raw) {
    const s = (raw || '').trim();
    return /^MS4wLjABAAAA[A-Za-z0-9_-]+$/i.test(s) || /^[A-Za-z0-9_-]{24,}$/.test(s);
}
function looksLikeDouyinUserId(raw) {
    const s = (raw || '').trim();
    return isDouyinUniqueId(s) || isDouyinSecUid(s);
}
function parseDouyinInput(raw) {
    const input = (raw || '').trim();
    if (!input) {
        throw new common_1.BadRequestException('抖音输入不能为空');
    }
    const searchMatch = input.match(/douyin\.com\/(?:jingxuan\/)?search\/([^?&#/]+)/i);
    if (searchMatch) {
        const keyword = safeDecode(searchMatch[1]);
        if (!keyword)
            throw new common_1.BadRequestException('无法从搜索链接解析关键词');
        return { kind: 'search_keyword', keyword };
    }
    const userMatch = input.match(/douyin\.com\/user\/([^?&#/]+)/i);
    if (userMatch) {
        const id = safeDecode(userMatch[1]);
        if (!id || id.includes('?') || id.includes('%') || /[\u4e00-\u9fff]/.test(id)) {
            throw new common_1.BadRequestException('无效的抖音用户链接');
        }
        if (isDouyinSecUid(id)) {
            return { kind: 'user_id', userId: id, idType: 'sec_uid' };
        }
        if (isDouyinUniqueId(id)) {
            return { kind: 'user_id', userId: id, idType: 'unique_id' };
        }
        return { kind: 'user_id', userId: id, idType: 'sec_uid' };
    }
    const liveMatch = input.match(/live\.douyin\.com\/([^?&#/]+)/i);
    if (liveMatch) {
        return { kind: 'live_id', liveId: safeDecode(liveMatch[1]) };
    }
    if (/v\.douyin\.com|douyin\.com/i.test(input) && /\s/.test(input)) {
        return { kind: 'share_text', text: input };
    }
    if (isDouyinSecUid(input)) {
        return { kind: 'user_id', userId: input, idType: 'sec_uid' };
    }
    if (isDouyinUniqueId(input)) {
        return { kind: 'user_id', userId: input, idType: 'unique_id' };
    }
    return { kind: 'search_keyword', keyword: input };
}
function safeDecode(s) {
    try {
        return decodeURIComponent(s).trim();
    }
    catch {
        return s.trim();
    }
}
function assertDouyinUserId(uid) {
    if (!looksLikeDouyinUserId(uid)) {
        throw new common_1.BadRequestException('无效的抖音用户 ID。请输入抖音号（如 kelie329157），不支持昵称。');
    }
}
function assertStableDouyinUid(uid) {
    assertDouyinUserId(uid);
}
//# sourceMappingURL=douyin-input.js.map