"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUserFromJson = extractUserFromJson;
exports.parseDouyinProfileFromHtml = parseDouyinProfileFromHtml;
exports.extractEscapedLiveAnchor = extractEscapedLiveAnchor;
exports.toNormalizedProfile = toNormalizedProfile;
exports.hasAvatar = hasAvatar;
exports.extractOgImage = extractOgImage;
function asHttpUrl(raw) {
    const s = String(raw || '').trim();
    if (!s)
        return '';
    if (/^https?:\/\//i.test(s))
        return s;
    if (s.startsWith('//'))
        return `https:${s}`;
    return '';
}
function pickAvatar(node) {
    if (!node)
        return '';
    if (typeof node === 'string')
        return asHttpUrl(node);
    if (typeof node !== 'object')
        return '';
    const o = node;
    const list = o.url_list || o.urlList;
    if (Array.isArray(list)) {
        for (const item of list) {
            const url = asHttpUrl(item);
            if (url)
                return url;
        }
    }
    return asHttpUrl(o.uri) || asHttpUrl(o.url);
}
function fromUserObject(user, fallbackId) {
    const nickname = String(user.nickname || user.nick_name || '').trim();
    const uniqueId = String(user.unique_id || user.uniqueId || fallbackId).trim();
    const secUid = String(user.sec_uid || user.secUid || user.sec_user_id || '').trim();
    const avatar = pickAvatar(user.avatar_larger) ||
        pickAvatar(user.avatar_medium) ||
        pickAvatar(user.avatar_thumb) ||
        pickAvatar(user.avatar_300x300) ||
        pickAvatar(user.avatar_168x168) ||
        pickAvatar(user.avatar_uri) ||
        pickAvatar(user.AvatarThumb) ||
        asHttpUrl(user.avatar_url) ||
        asHttpUrl(user.avatar) ||
        asHttpUrl(user.avatar_uri);
    if (!nickname && !secUid && !uniqueId)
        return null;
    return { nickname, avatarUrl: avatar, secUid, uniqueId };
}
function extractUserFromJson(payload, fallbackId = '') {
    if (!payload || typeof payload !== 'object')
        return null;
    const queue = [payload];
    const seen = new Set();
    let bestWithoutAvatar = null;
    while (queue.length) {
        const cur = queue.shift();
        if (!cur || typeof cur !== 'object' || seen.has(cur))
            continue;
        seen.add(cur);
        const o = cur;
        const hasNick = Boolean(o.nickname || o.nick_name);
        const hasId = Boolean(o.sec_uid || o.secUid || o.unique_id || o.uniqueId);
        if (hasNick && hasId) {
            const parsed = fromUserObject(o, fallbackId);
            if (parsed?.nickname) {
                if (hasAvatar(parsed))
                    return parsed;
                if (!bestWithoutAvatar)
                    bestWithoutAvatar = parsed;
            }
        }
        for (const v of Object.values(o)) {
            if (v && typeof v === 'object')
                queue.push(v);
        }
    }
    return bestWithoutAvatar;
}
function parseDouyinProfileFromHtml(html, fallbackId = '') {
    if (!html)
        return null;
    let loose = null;
    const keep = (parsed) => {
        if (!parsed?.nickname)
            return false;
        if (hasAvatar(parsed)) {
            loose = parsed;
            return true;
        }
        loose = loose || parsed;
        return false;
    };
    const nextMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (nextMatch?.[1]) {
        try {
            const parsed = extractUserFromJson(JSON.parse(nextMatch[1]), fallbackId);
            if (keep(parsed))
                return loose;
        }
        catch {
        }
    }
    const renderMatch = html.match(/<script[^>]*id=["']RENDER_DATA["'][^>]*>([\s\S]*?)<\/script>/i);
    if (renderMatch?.[1]) {
        try {
            const decoded = decodeURIComponent(renderMatch[1].trim());
            const parsed = extractUserFromJson(JSON.parse(decoded), fallbackId);
            if (keep(parsed))
                return loose;
        }
        catch {
        }
    }
    const scriptJsons = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    for (const m of scriptJsons) {
        const body = (m[1] || '').trim();
        if (!body.startsWith('{') && !body.startsWith('['))
            continue;
        if (!/nickname|sec_uid|unique_id/i.test(body))
            continue;
        try {
            const parsed = extractUserFromJson(JSON.parse(body), fallbackId);
            if (keep(parsed))
                return loose;
        }
        catch {
        }
    }
    const embedded = extractEscapedLiveAnchor(html, fallbackId);
    if (embedded && hasAvatar(embedded))
        return embedded;
    return loose;
}
function extractEscapedLiveAnchor(html, uniqueId) {
    const id = (uniqueId || '').trim();
    if (!html || !id)
        return null;
    const safe = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
        new RegExp(`web_rid\\\\":\\\\"${safe}\\\\"[\\s\\S]{0,1500}?sec_uid\\\\":\\\\"([^\\\\"]+)\\\\"[\\s\\S]{0,600}?nickname\\\\":\\\\"([^\\\\"]+)\\\\"[\\s\\S]{0,800}?url_list\\\\":\\[\\\\"(https:[^\\\\"]+)`),
        new RegExp(`"web_rid":"${safe}"[\\s\\S]{0,1500}?"sec_uid":"([^"]+)"[\\s\\S]{0,600}?"nickname":"([^"]+)"[\\s\\S]{0,800}?"url_list":\\["(https:[^"]+)`),
    ];
    for (const re of patterns) {
        const m = html.match(re);
        if (!m)
            continue;
        const avatarUrl = m[3].replace(/\\u002F/gi, '/').replace(/\\\//g, '/');
        if (!/^https?:\/\//i.test(avatarUrl))
            continue;
        return {
            nickname: m[2],
            avatarUrl,
            secUid: m[1],
            uniqueId: id,
        };
    }
    return null;
}
function toNormalizedProfile(bits, fallbackId) {
    const uniqueId = bits.uniqueId || fallbackId;
    const platformUid = bits.secUid || uniqueId || fallbackId;
    return {
        platform: 'douyin',
        platformUid,
        roomId: uniqueId,
        nickname: bits.nickname || uniqueId,
        avatarUrl: bits.avatarUrl || '',
        profileUrl: bits.secUid
            ? `https://www.douyin.com/user/${bits.secUid}`
            : `https://www.douyin.com/search/${encodeURIComponent(uniqueId)}?type=user`,
    };
}
function hasAvatar(bits) {
    return Boolean(bits?.avatarUrl?.trim());
}
function extractOgImage(html) {
    if (!html)
        return '';
    const m = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const url = (m?.[1] || '').trim();
    if (!url || url.startsWith('data:'))
        return '';
    return url;
}
//# sourceMappingURL=douyin-profile-parse.js.map