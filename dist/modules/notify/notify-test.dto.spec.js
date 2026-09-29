"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const notify_controller_1 = require("./notify.controller");
const live_notify_data_1 = require("./live-notify-data");
const pipeOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: false,
};
async function errorsOf(body) {
    const dto = (0, class_transformer_1.plainToInstance)(notify_controller_1.NotifyTestDto, body);
    return (0, class_validator_1.validate)(dto, pipeOptions);
}
describe('NotifyTestDto', () => {
    it('accepts the message field sent by the help-center test button', async () => {
        const errors = await errorsOf({ message: '测试推送' });
        expect(errors).toHaveLength(0);
    });
    it('still rejects fields outside the dto', async () => {
        const errors = await errorsOf({ message: '测试推送', extra: 'nope' });
        expect(errors.map((e) => e.property)).toContain('extra');
    });
});
describe('buildLiveNotifyData', () => {
    it('uses the live-notify template keywords', () => {
        const data = (0, live_notify_data_1.buildLiveNotifyData)({
            anchorName: '测试主播',
            topic: '测试直播',
            remark: '测试推送',
            time: '2026-09-28 22:35:00',
        });
        expect(Object.keys(data).sort()).toEqual(['thing1', 'thing4', 'thing5', 'time3']);
        expect(data).not.toHaveProperty('thing2');
        expect(data.thing1.value).toBe('测试主播');
        expect(data.thing5.value).toBe('测试直播');
        expect(data.thing4.value).toBe('测试推送');
        expect(data.time3.value).toBe('2026-09-28 22:35:00');
    });
});
//# sourceMappingURL=notify-test.dto.spec.js.map