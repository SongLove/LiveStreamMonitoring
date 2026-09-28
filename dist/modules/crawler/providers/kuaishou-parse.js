"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractKuaishouId = extractKuaishouId;
exports.parseKuaishouLiveHtml = parseKuaishouLiveHtml;
function extractKuaishouId(raw) {
    const input = (raw || '').trim();
    if (!input)
        return '';
    const urlMatch = input.match(/live\.kuaishou\.com\/(?:u|profile)\/([A-Za-z0-9_-]+)/i);
    if (urlMatch)
        return urlMatch[1];
    const share = input.match(/v\.kuaishou\.com\/([A-Za-z0-9]+)/i);
    if (share)
        return share[1];
    if (/^[\u4e00-\u9fff]/.test(input))
        return '';
    if (/^[A-Za-z0-9_-]{2,64}$/.test(input))
        return input;
    return '';
}
function decodeJsString(raw) {
    try {
        return JSON.parse(`"${raw}"`);
    }
    catch {
        return raw.replace(/\\u002F/gi, '/').replace(/\\n/g, '\n');
    }
}
function asHttp(raw) {
    const s = decodeJsString(raw).trim();
    if (/^https?:\/\//i.test(s))
        return s;
    if (s.startsWith('//'))
        return `https:${s}`;
    return '';
}
function parseKuaishouLiveHtml(html, fallbackId = '') {
    if (!html)
        return null;
    const author = html.match(/"id":"([A-Za-z0-9_-]+)","name":"((?:\\.|[^"\\])*)","description":"(?:\\.|[^"\\])*","avatar":"((?:\\.|[^"\\])*)"(?:,"sex":"[^"]*")?,"living":(true|false)/);
    let platformUid = author?.[1] || fallbackId;
    let nickname = author ? decodeJsString(author[2]) : '';
    let avatarUrl = author ? asHttp(author[3]) : '';
    if (!nickname) {
        const nameEl = html.match(/class="name"[^>]*>([^<]+)</);
        if (nameEl)
            nickname = nameEl[1].trim();
    }
    if (!avatarUrl) {
        const img = html.match(/class="avatar"\s+src="(https?:\/\/[^"]+)"/);
        if (img)
            avatarUrl = img[1];
    }
    if (!nickname) {
        const title = html.match(/<title[^>]*>([^<]+)-快手直播<\/title>/);
        if (title)
            nickname = title[1].trim();
    }
    const roomFlag = html.match(/"isLiving":(true|false)/);
    const hasPlayUrl = /"playUrls"[\s\S]{0,800}?"url":"https?:/.test(html);
    const living = roomFlag?.[1] === 'true' || (!roomFlag && hasPlayUrl);
    if (!platformUid && !nickname)
        return null;
    return {
        platformUid: platformUid || fallbackId,
        nickname: nickname || platformUid || fallbackId,
        avatarUrl,
        living,
    };
}
//# sourceMappingURL=kuaishou-parse.js.map