"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLiveNotifyData = buildLiveNotifyData;
exports.formatSubscribeTime = formatSubscribeTime;
function buildLiveNotifyData(input) {
    return {
        thing1: { value: input.anchorName },
        thing5: { value: input.topic },
        thing4: { value: input.remark },
        time3: { value: input.time },
    };
}
function formatSubscribeTime(date = new Date()) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}
//# sourceMappingURL=live-notify-data.js.map