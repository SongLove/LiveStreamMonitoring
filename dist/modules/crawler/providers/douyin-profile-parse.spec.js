"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const douyin_profile_parse_1 = require("./douyin-profile-parse");
describe('douyin-profile-parse', () => {
    const sampleUser = {
        user: {
            nickname: '可乐测试号',
            unique_id: 'kelie329157',
            sec_uid: 'MS4wLjABAAAAtestdouyinuid',
            avatar_thumb: { url_list: ['https://cdn.example/a.jpg'] },
        },
    };
    it('extracts user from nested json', () => {
        const bits = (0, douyin_profile_parse_1.extractUserFromJson)(sampleUser, 'kelie329157');
        expect(bits).toMatchObject({
            nickname: '可乐测试号',
            uniqueId: 'kelie329157',
            secUid: 'MS4wLjABAAAAtestdouyinuid',
            avatarUrl: 'https://cdn.example/a.jpg',
        });
    });
    it('prefers candidate with http avatar over earlier nickname-only node', () => {
        const payload = {
            recommend: {
                nickname: '推荐位占位',
                unique_id: 'kelie329157',
                sec_uid: 'MS4wLjABAAAAplaceholder',
                avatar_thumb: { uri: '100x100/aweme-avatar/tos-cn-i-xxx' },
            },
            owner: {
                nickname: '可乐测试号',
                unique_id: 'kelie329157',
                sec_uid: 'MS4wLjABAAAAtestdouyinuid',
                avatar_thumb: { url_list: ['https://cdn.example/real.jpg'] },
            },
        };
        const bits = (0, douyin_profile_parse_1.extractUserFromJson)(payload, 'kelie329157');
        expect(bits?.avatarUrl).toBe('https://cdn.example/real.jpg');
        expect(bits?.nickname).toBe('可乐测试号');
    });
    it('ignores non-http avatar uri', () => {
        const bits = (0, douyin_profile_parse_1.extractUserFromJson)({
            user: {
                nickname: '仅相对路径',
                unique_id: 'kelie329157',
                sec_uid: 'MS4wLjABAAAA',
                avatar_thumb: { uri: '100x100/aweme-avatar/tos-cn-i-xxx' },
            },
        }, 'kelie329157');
        expect(bits?.avatarUrl).toBe('');
    });
    it('parses __NEXT_DATA__ html', () => {
        const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(sampleUser)}</script></html>`;
        const bits = (0, douyin_profile_parse_1.parseDouyinProfileFromHtml)(html, 'kelie329157');
        expect(bits?.nickname).toBe('可乐测试号');
        expect(bits?.avatarUrl).toBe('https://cdn.example/a.jpg');
    });
    it('parses RENDER_DATA uri-encoded json', () => {
        const encoded = encodeURIComponent(JSON.stringify(sampleUser));
        const html = `<html><script id="RENDER_DATA" type="application/json">${encoded}</script></html>`;
        const bits = (0, douyin_profile_parse_1.parseDouyinProfileFromHtml)(html, 'kelie329157');
        expect(bits?.secUid).toBe('MS4wLjABAAAAtestdouyinuid');
    });
    it('toNormalizedProfile prefers sec_uid as platformUid', () => {
        const profile = (0, douyin_profile_parse_1.toNormalizedProfile)({
            nickname: '可乐测试号',
            avatarUrl: 'https://cdn.example/a.jpg',
            secUid: 'MS4wLjABAAAAtestdouyinuid',
            uniqueId: 'kelie329157',
        }, 'kelie329157');
        expect(profile.platformUid).toBe('MS4wLjABAAAAtestdouyinuid');
        expect(profile.roomId).toBe('kelie329157');
        expect(profile.profileUrl).toContain('/user/MS4wLjABAAAAtestdouyinuid');
    });
});
describe('hasAvatar / extractOgImage', () => {
    it('rejects empty avatar', () => {
        expect((0, douyin_profile_parse_1.hasAvatar)({ avatarUrl: '' })).toBe(false);
        expect((0, douyin_profile_parse_1.hasAvatar)(null)).toBe(false);
    });
    it('accepts non-empty avatar', () => {
        expect((0, douyin_profile_parse_1.hasAvatar)({ avatarUrl: 'https://cdn.example/a.jpg' })).toBe(true);
    });
    it('extracts og:image from html', () => {
        const html = '<meta property="og:image" content="https://cdn.example/og.jpg" />';
        expect((0, douyin_profile_parse_1.extractOgImage)(html)).toBe('https://cdn.example/og.jpg');
    });
});
describe('isIncompleteDouyinProfile', () => {
    const { isIncompleteDouyinProfile } = require('./douyin-playwright.provider');
    it('flags missing avatar even with real nickname', () => {
        expect(isIncompleteDouyinProfile({
            nickname: '克烈',
            avatarUrl: '',
            platformUid: 'MS4wLjABAAAA',
            roomId: 'kelie329157',
        })).toBe(true);
    });
    it('flags placeholder nick=uid without avatar', () => {
        expect(isIncompleteDouyinProfile({
            nickname: 'kelie329157',
            avatarUrl: '',
            platformUid: 'kelie329157',
            roomId: 'kelie329157',
        })).toBe(true);
    });
    it('accepts profile with avatar', () => {
        expect(isIncompleteDouyinProfile({
            nickname: 'kelie329157',
            avatarUrl: 'https://cdn.example/a.jpg',
            platformUid: 'kelie329157',
        })).toBe(false);
    });
});
//# sourceMappingURL=douyin-profile-parse.spec.js.map