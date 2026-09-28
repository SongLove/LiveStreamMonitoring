"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseWechatCallbackBody = parseWechatCallbackBody;
const normalize_1 = require("../../common/utils/normalize");
function extractTag(block, tag) {
    const cdata = new RegExp(`<${tag}><!\\[CDATA\\[([^\\]]*)\\]\\]></${tag}>`, 'i').exec(block);
    if (cdata?.[1] != null)
        return String(cdata[1]).trim();
    const plain = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i').exec(block);
    return plain?.[1] != null ? String(plain[1]).trim() : '';
}
function parseSubscribeListBlocks(xml) {
    const items = [];
    const listRe = /<List>([\s\S]*?)<\/List>/gi;
    let m;
    while ((m = listRe.exec(xml))) {
        const block = m[1] || '';
        const templateId = extractTag(block, 'TemplateId');
        const status = extractTag(block, 'SubscribeStatusString');
        if (!templateId && !status)
            continue;
        items.push({
            templateId,
            status,
            popupScene: extractTag(block, 'PopupScene') || undefined,
        });
    }
    return items;
}
function parseXmlCallback(raw) {
    const encrypted = /<Encrypt>/i.test(raw);
    return {
        event: extractTag(raw, 'Event'),
        fromUserName: extractTag(raw, 'FromUserName'),
        createTime: extractTag(raw, 'CreateTime'),
        items: parseSubscribeListBlocks(raw),
        encrypted,
    };
}
function pickListFromObject(body) {
    if (body.List != null)
        return body.List;
    if (body.list != null)
        return body.list;
    const popup = body.SubscribeMsgPopupEvent;
    if (popup?.List != null)
        return popup.List;
    const change = body.SubscribeMsgChangeEvent;
    if (change?.List != null)
        return change.List;
    if (Array.isArray(body.SubscribeMsgPopupEvent))
        return body.SubscribeMsgPopupEvent;
    return null;
}
function objectToItems(body) {
    const listRaw = pickListFromObject(body);
    const rows = (0, normalize_1.normalizeWechatList)(listRaw);
    return rows
        .map((row) => {
        const o = row;
        return {
            templateId: String(o.TemplateId || o.templateId || '').trim(),
            status: String(o.SubscribeStatusString || o.status || '').trim(),
            popupScene: String(o.PopupScene || o.popupScene || '').trim() || undefined,
        };
    })
        .filter((r) => r.templateId || r.status);
}
function parseWechatCallbackBody(raw) {
    if (raw == null) {
        return { event: '', fromUserName: '', createTime: '', items: [], encrypted: false };
    }
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed) {
            return { event: '', fromUserName: '', createTime: '', items: [], encrypted: false };
        }
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                return parseWechatCallbackBody(JSON.parse(trimmed));
            }
            catch {
                return { event: '', fromUserName: '', createTime: '', items: [], encrypted: false };
            }
        }
        if (trimmed.startsWith('<')) {
            return parseXmlCallback(trimmed);
        }
        return { event: '', fromUserName: '', createTime: '', items: [], encrypted: false };
    }
    if (typeof raw === 'object') {
        const body = raw;
        return {
            event: String(body.Event || body.event || ''),
            fromUserName: String(body.FromUserName || body.fromUserName || ''),
            createTime: String(body.CreateTime || body.createTime || ''),
            items: objectToItems(body),
            encrypted: Boolean(body.Encrypt || body.encrypt),
        };
    }
    return { event: '', fromUserName: '', createTime: '', items: [], encrypted: false };
}
//# sourceMappingURL=wechat-callback.parse.js.map