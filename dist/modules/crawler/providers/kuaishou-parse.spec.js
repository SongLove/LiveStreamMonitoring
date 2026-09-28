"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kuaishou_parse_1 = require("./kuaishou-parse");
const FIXTURE = `<title data-vm-ssr="true">KPL王者荣耀职业联赛-快手直播</title>
<img class="avatar" src="https://p66.a.kwimgs.com/uhead/a.jpg" alt="avatar">
<div class="name" data-v-x>KPL王者荣耀职业联赛</div>
"id":"KPL704668133","name":"KPL王者荣耀职业联赛","description":"啊～\\n原来这是有认证的官方啊！","avatar":"https:\\u002F\\u002Fp66.a.kwimgs.com\\u002Fuhead\\u002Fa.jpg","sex":"F","living":false
"isLiving":true`;
describe('kuaishou-parse', () => {
    it('extracts id from live url or raw id', () => {
        expect((0, kuaishou_parse_1.extractKuaishouId)('https://live.kuaishou.com/u/KPL704668133')).toBe('KPL704668133');
        expect((0, kuaishou_parse_1.extractKuaishouId)('KPL704668133')).toBe('KPL704668133');
        expect((0, kuaishou_parse_1.extractKuaishouId)('按昵称搜')).toBe('');
    });
    it('parses avatar, name, and room-level isLiving (not author.living)', () => {
        const parsed = (0, kuaishou_parse_1.parseKuaishouLiveHtml)(FIXTURE, 'KPL704668133');
        expect(parsed).toMatchObject({
            platformUid: 'KPL704668133',
            nickname: 'KPL王者荣耀职业联赛',
            avatarUrl: 'https://p66.a.kwimgs.com/uhead/a.jpg',
            living: true,
        });
    });
    it('treats missing isLiving and no play url as offline', () => {
        const html = '"id":"abc123","name":"测试","description":"hi","avatar":"https://cdn.example/a.jpg","sex":"F","living":false';
        expect((0, kuaishou_parse_1.parseKuaishouLiveHtml)(html)?.living).toBe(false);
    });
});
//# sourceMappingURL=kuaishou-parse.spec.js.map