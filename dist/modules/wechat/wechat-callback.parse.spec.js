"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wechat_callback_parse_1 = require("./wechat-callback.parse");
const XML_POPUP = `<xml>
  <ToUserName><![CDATA[gh_test]]></ToUserName>
  <FromUserName><![CDATA[oABC123]]></FromUserName>
  <CreateTime>1610969440</CreateTime>
  <MsgType><![CDATA[event]]></MsgType>
  <Event><![CDATA[subscribe_msg_popup_event]]></Event>
  <SubscribeMsgPopupEvent>
    <List>
      <TemplateId><![CDATA[TMPL_1]]></TemplateId>
      <SubscribeStatusString><![CDATA[accept]]></SubscribeStatusString>
      <PopupScene>0</PopupScene>
    </List>
  </SubscribeMsgPopupEvent>
</xml>`;
describe('parseWechatCallbackBody', () => {
    it('parses subscribe_msg_popup_event XML', () => {
        const parsed = (0, wechat_callback_parse_1.parseWechatCallbackBody)(XML_POPUP);
        expect(parsed.event).toBe('subscribe_msg_popup_event');
        expect(parsed.fromUserName).toBe('oABC123');
        expect(parsed.createTime).toBe('1610969440');
        expect(parsed.items).toEqual([
            {
                templateId: 'TMPL_1',
                status: 'accept',
                popupScene: '0',
            },
        ]);
    });
    it('parses JSON with top-level List', () => {
        const parsed = (0, wechat_callback_parse_1.parseWechatCallbackBody)({
            FromUserName: 'o1',
            Event: 'subscribe_msg_popup_event',
            CreateTime: '123',
            List: [{ TemplateId: 'T1', SubscribeStatusString: 'accept', PopupScene: '1' }],
        });
        expect(parsed.items).toHaveLength(1);
        expect(parsed.items[0].templateId).toBe('T1');
    });
    it('parses JSON with nested SubscribeMsgPopupEvent.List object', () => {
        const parsed = (0, wechat_callback_parse_1.parseWechatCallbackBody)({
            FromUserName: 'o2',
            Event: 'subscribe_msg_popup_event',
            SubscribeMsgPopupEvent: {
                List: { TemplateId: 'T2', SubscribeStatusString: 'reject' },
            },
        });
        expect(parsed.items[0]).toMatchObject({ templateId: 'T2', status: 'reject' });
    });
    it('empty body => no items', () => {
        expect((0, wechat_callback_parse_1.parseWechatCallbackBody)(undefined).items).toEqual([]);
        expect((0, wechat_callback_parse_1.parseWechatCallbackBody)('').items).toEqual([]);
    });
});
//# sourceMappingURL=wechat-callback.parse.spec.js.map