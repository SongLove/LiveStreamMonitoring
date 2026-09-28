"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomMatchesTarget = roomMatchesTarget;
exports.parseDouyinLivePayload = parseDouyinLivePayload;
exports.pickDouyinLiveProbe = pickDouyinLiveProbe;
function pickCover(node) {
    if (!node)
        return '';
    if (typeof node === 'string')
        return node;
    if (typeof node !== 'object')
        return '';
    const o = node;
    const list = o.url_list || o.urlList;
    if (Array.isArray(list) && list[0])
        return String(list[0]);
    if (o.uri)
        return String(o.uri);
    return '';
}
function normId(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^\./, '');
}
function roomMatchesTarget(node, targetWebRid) {
    if (!targetWebRid)
        return true;
    const target = normId(targetWebRid);
    if (!target)
        return true;
    const owner = node.owner && typeof node.owner === 'object'
        ? node.owner
        : null;
    const ids = [
        node.web_rid,
        node.webRid,
        node.unique_id,
        node.uniqueId,
        owner?.unique_id,
        owner?.uniqueId,
        owner?.display_id,
        owner?.displayId,
    ]
        .map(normId)
        .filter(Boolean);
    return ids.includes(target);
}
function isEnterApiUrl(url) {
    return Boolean(url && /room\/web\/enter|webcast\/room\/web\/enter/i.test(url));
}
function extractPrimaryRoom(data) {
    const roomList = Array.isArray(data.data) ? data.data[0] : data.room;
    if (roomList && typeof roomList === 'object') {
        return roomList;
    }
    return {};
}
function parseDouyinLivePayload(payload, targetWebRid) {
    if (!payload || typeof payload !== 'object')
        return null;
    const root = payload;
    const data = root.data && typeof root.data === 'object'
        ? root.data
        : root;
    if ('room_status' in data || 'roomStatus' in data) {
        const rs = Number(data.room_status ?? data.roomStatus);
        if (!Number.isNaN(rs)) {
            const room = extractPrimaryRoom(data);
            const isLive = rs === 0;
            if (isLive && targetWebRid && !roomMatchesTarget(room, targetWebRid)) {
                return null;
            }
            const title = String(room.title || data.title || '').trim();
            const cover = pickCover(room.cover) ||
                pickCover(room.cover_url) ||
                '';
            return {
                status: isLive ? 'live' : 'not_live',
                title,
                coverUrl: cover,
                confidence: 0.9,
            };
        }
    }
    return findRoomBits(payload, targetWebRid);
}
function findRoomBits(payload, targetWebRid) {
    const queue = [payload];
    const seen = new Set();
    while (queue.length) {
        const cur = queue.shift();
        if (!cur || typeof cur !== 'object' || seen.has(cur))
            continue;
        seen.add(cur);
        const o = cur;
        if ('room_status' in o || 'roomStatus' in o) {
            const rs = Number(o.room_status ?? o.roomStatus);
            if (!Number.isNaN(rs)) {
                const isLive = rs === 0;
                if (targetWebRid && !roomMatchesTarget(o, targetWebRid)) {
                }
                else {
                    return {
                        status: isLive ? 'live' : 'not_live',
                        title: String(o.title || '').trim(),
                        coverUrl: pickCover(o.cover) || pickCover(o.cover_url) || '',
                        confidence: 0.9,
                    };
                }
            }
        }
        const hasTitle = typeof o.title === 'string' && o.title.length > 0;
        const statusStr = o.status_str ?? o.statusStr;
        const statusNum = o.status;
        if (hasTitle && (statusStr !== undefined || statusNum !== undefined)) {
            const liveByStr = String(statusStr) === '2';
            const liveByNum = Number(statusNum) === 2;
            const isLive = liveByStr || liveByNum;
            const isOfflineByFour = String(statusStr) === '4' || Number(statusNum) === 4;
            if (isLive || isOfflineByFour) {
                if (targetWebRid && !roomMatchesTarget(o, targetWebRid)) {
                }
                else {
                    return {
                        status: isLive ? 'live' : 'not_live',
                        title: String(o.title).trim(),
                        coverUrl: pickCover(o.cover) || '',
                        confidence: 0.85,
                    };
                }
            }
        }
        for (const v of Object.values(o)) {
            if (v && typeof v === 'object')
                queue.push(v);
        }
    }
    return null;
}
function pickDouyinLiveProbe(sources, targetWebRid) {
    const scored = [];
    for (const src of sources) {
        const parsed = parseDouyinLivePayload(src.data, targetWebRid);
        if (!parsed)
            continue;
        let score = parsed.confidence;
        if (isEnterApiUrl(src.url))
            score += 2;
        if (parsed.status === 'not_live')
            score += 0.5;
        scored.push({ ...parsed, score });
    }
    if (!scored.length)
        return null;
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    return {
        status: best.status,
        title: best.title,
        coverUrl: best.coverUrl,
        confidence: best.confidence,
    };
}
//# sourceMappingURL=douyin-live-parse.js.map