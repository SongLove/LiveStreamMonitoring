"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const anchor_service_1 = require("./anchor.service");
describe('buildAnchorProfileUpdate', () => {
    it('does not put avatarUrl in both $set and $setOnInsert', () => {
        const withAvatar = (0, anchor_service_1.buildAnchorProfileUpdate)({
            nickname: 'KPL',
            avatarUrl: 'https://p66.a.kwimgs.com/a.jpg',
            profileUrl: 'https://live.kuaishou.com/u/KPL704668133',
            roomId: 'KPL704668133',
        });
        expect(withAvatar.$set.avatarUrl).toBe('https://p66.a.kwimgs.com/a.jpg');
        expect(withAvatar.$setOnInsert).not.toHaveProperty('avatarUrl');
        const empty = (0, anchor_service_1.buildAnchorProfileUpdate)({
            nickname: 'KPL',
            avatarUrl: '',
            profileUrl: 'https://live.kuaishou.com/u/x',
            roomId: 'x',
        });
        expect(empty.$set).not.toHaveProperty('avatarUrl');
        expect(empty.$setOnInsert.avatarUrl).toBe('');
    });
});
//# sourceMappingURL=anchor-upsert.spec.js.map