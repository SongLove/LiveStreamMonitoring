"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const douyin_live_parse_1 = require("./douyin-live-parse");
describe('parseDouyinLivePayload', () => {
    it('room_status 0 => live', () => {
        const parsed = (0, douyin_live_parse_1.parseDouyinLivePayload)({
            data: {
                room_status: 0,
                data: [{ title: '今晚开播', cover: { url_list: ['https://cdn/x.jpg'] } }],
            },
        });
        expect(parsed).toMatchObject({
            status: 'live',
            title: '今晚开播',
            coverUrl: 'https://cdn/x.jpg',
            confidence: 0.9,
        });
    });
    it('room_status 2 => not_live', () => {
        const parsed = (0, douyin_live_parse_1.parseDouyinLivePayload)({
            data: { room_status: 2, data: [{ title: '已下播' }] },
        });
        expect(parsed?.status).toBe('not_live');
        expect(parsed?.title).toBe('已下播');
    });
    it('roomStore status_str 2 => live without target filter', () => {
        const parsed = (0, douyin_live_parse_1.parseDouyinLivePayload)({
            state: {
                roomStore: {
                    roomInfo: {
                        room: {
                            title: 'SSR直播',
                            status_str: '2',
                            unique_id: 'kelie329157',
                            cover: { url_list: ['a'] },
                        },
                    },
                },
            },
        });
        expect(parsed).toMatchObject({
            status: 'live',
            title: 'SSR直播',
            confidence: 0.85,
        });
    });
    it('roomStore status 4 => not_live', () => {
        const parsed = (0, douyin_live_parse_1.parseDouyinLivePayload)({
            room: { title: '歇了', status: 4, unique_id: 'kelie329157' },
        });
        expect(parsed?.status).toBe('not_live');
    });
    it('unrelated json => null', () => {
        expect((0, douyin_live_parse_1.parseDouyinLivePayload)({ foo: 1 })).toBeNull();
        expect((0, douyin_live_parse_1.parseDouyinLivePayload)(null)).toBeNull();
    });
});
describe('parseDouyinLivePayload with target webRid', () => {
    it('ignores recommended live room for another anchor', () => {
        const payload = {
            data: {
                list: [
                    {
                        title: '别的主播正在播',
                        status_str: '2',
                        owner: { unique_id: 'other_anchor_123' },
                    },
                ],
            },
        };
        expect((0, douyin_live_parse_1.parseDouyinLivePayload)(payload)).toMatchObject({ status: 'live' });
        expect((0, douyin_live_parse_1.parseDouyinLivePayload)(payload, 'kelie329157')).toBeNull();
    });
    it('accepts enter API room_status 2 for target anchor', () => {
        expect((0, douyin_live_parse_1.parseDouyinLivePayload)({
            data: {
                room_status: 2,
                data: [{ title: '已下播', owner: { unique_id: 'kelie329157' } }],
            },
        }, 'kelie329157')).toMatchObject({ status: 'not_live', confidence: 0.9 });
    });
    it('rejects live room_status 0 when owner unique_id mismatches', () => {
        expect((0, douyin_live_parse_1.parseDouyinLivePayload)({
            data: {
                room_status: 0,
                data: [{ title: '冒领直播', owner: { unique_id: 'other' } }],
            },
        }, 'kelie329157')).toBeNull();
    });
    it('accepts live when owner unique_id matches target', () => {
        expect((0, douyin_live_parse_1.parseDouyinLivePayload)({
            data: {
                room_status: 0,
                data: [{ title: '真直播', owner: { unique_id: 'kelie329157' } }],
            },
        }, 'kelie329157')).toMatchObject({ status: 'live' });
    });
});
describe('pickDouyinLiveProbe', () => {
    it('prefers enter API not_live over recommended live list', () => {
        const picked = (0, douyin_live_parse_1.pickDouyinLiveProbe)([
            {
                url: 'https://live.douyin.com/webcast/room/info/',
                data: {
                    data: {
                        list: [
                            {
                                title: '推荐直播',
                                status_str: '2',
                                owner: { unique_id: 'someone_else' },
                            },
                        ],
                    },
                },
            },
            {
                url: 'https://live.douyin.com/webcast/room/web/enter/',
                data: {
                    data: {
                        room_status: 2,
                        data: [{ title: '克烈', owner: { unique_id: 'kelie329157' } }],
                    },
                },
            },
        ], 'kelie329157');
        expect(picked?.status).toBe('not_live');
    });
});
//# sourceMappingURL=douyin-live-parse.spec.js.map