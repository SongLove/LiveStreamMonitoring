"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const provider_chain_service_1 = require("./chain/provider-chain.service");
const provider_skip_error_1 = require("./providers/provider-skip.error");
function mockProvider(name, resolveImpl) {
    return {
        name,
        platform: 'douyin',
        healthCheck: async () => ({ ok: true }),
        resolve: resolveImpl,
        fetchStatus: async () => {
            throw new provider_skip_error_1.ProviderSkippedError(name, 'n/a');
        },
    };
}
describe('ProviderChainService.resolveChain', () => {
    it('skips unconfigured third-party and uses playwright', async () => {
        const chain = new provider_chain_service_1.ProviderChainService();
        const calls = [];
        const third = mockProvider('douyin-third-party', async () => {
            calls.push('third');
            throw new provider_skip_error_1.ProviderSkippedError('douyin-third-party', 'not configured');
        });
        const sign = mockProvider('douyin-signature-stub', async () => {
            calls.push('sign');
            throw new provider_skip_error_1.ProviderSkippedError('douyin-signature-stub', 'stub');
        });
        const pw = mockProvider('douyin-playwright', async () => {
            calls.push('pw');
            return {
                platform: 'douyin',
                platformUid: 'MS4wLjABAAAAreal',
                roomId: 'kelie329157',
                nickname: '真实昵称',
                avatarUrl: 'https://cdn.example/x.jpg',
                profileUrl: 'https://www.douyin.com/user/MS4wLjABAAAAreal',
            };
        });
        const profile = await chain.resolveChain([third, sign, pw], 'kelie329157');
        expect(calls).toEqual(['third', 'sign', 'pw']);
        expect(profile.nickname).toBe('真实昵称');
        expect(profile.platformUid).toBe('MS4wLjABAAAAreal');
    });
    it('uses third-party when it succeeds first', async () => {
        const chain = new provider_chain_service_1.ProviderChainService();
        const calls = [];
        const third = mockProvider('douyin-third-party', async () => {
            calls.push('third');
            return {
                platform: 'douyin',
                platformUid: 'sec_from_api',
                roomId: 'kelie329157',
                nickname: 'API昵称',
                avatarUrl: 'https://cdn.example/api.jpg',
                profileUrl: 'https://www.douyin.com/user/sec_from_api',
            };
        });
        const pw = mockProvider('douyin-playwright', async () => {
            calls.push('pw');
            throw new Error('should not run');
        });
        const profile = await chain.resolveChain([third, pw], 'kelie329157');
        expect(calls).toEqual(['third']);
        expect(profile.nickname).toBe('API昵称');
    });
    it('falls through when first provider returns profile without avatar', async () => {
        const chain = new provider_chain_service_1.ProviderChainService();
        const calls = [];
        const third = mockProvider('douyin-third-party', async () => {
            calls.push('third');
            return {
                platform: 'douyin',
                platformUid: 'sec_incomplete',
                roomId: 'kelie329157',
                nickname: '无头像昵称',
                avatarUrl: '',
                profileUrl: 'https://www.douyin.com/user/sec_incomplete',
            };
        });
        const pw = mockProvider('douyin-playwright', async () => {
            calls.push('pw');
            return {
                platform: 'douyin',
                platformUid: 'MS4wLjABAAAAreal',
                roomId: 'kelie329157',
                nickname: '有头像昵称',
                avatarUrl: 'https://cdn.example/pw.jpg',
                profileUrl: 'https://www.douyin.com/user/MS4wLjABAAAAreal',
            };
        });
        const profile = await chain.resolveChain([third, pw], 'kelie329157');
        expect(calls).toEqual(['third', 'pw']);
        expect(profile.avatarUrl).toBe('https://cdn.example/pw.jpg');
    });
    it('surfaces BadRequestException from last provider', async () => {
        const chain = new provider_chain_service_1.ProviderChainService();
        const third = mockProvider('douyin-third-party', async () => {
            throw new provider_skip_error_1.ProviderSkippedError('douyin-third-party', 'skip');
        });
        const pw = mockProvider('douyin-playwright', async () => {
            throw new common_1.BadRequestException('未找到抖音号：nope');
        });
        await expect(chain.resolveChain([third, pw], 'nope')).rejects.toThrow(common_1.BadRequestException);
    });
});
describe('ProviderChainService.executeChain', () => {
    it('skips unconfigured third-party and uses playwright fetchStatus', async () => {
        const chain = new provider_chain_service_1.ProviderChainService();
        const calls = [];
        const third = {
            name: 'douyin-third-party',
            platform: 'douyin',
            healthCheck: async () => ({ ok: true }),
            resolve: async () => {
                throw new Error('n/a');
            },
            fetchStatus: async () => {
                calls.push('third');
                throw new provider_skip_error_1.ProviderSkippedError('douyin-third-party', 'not configured');
            },
        };
        const sign = {
            name: 'douyin-signature-stub',
            platform: 'douyin',
            healthCheck: async () => ({ ok: false }),
            resolve: async () => {
                throw new provider_skip_error_1.ProviderSkippedError('douyin-signature-stub', 'stub');
            },
            fetchStatus: async () => {
                calls.push('sign');
                throw new provider_skip_error_1.ProviderSkippedError('douyin-signature-stub', 'stub');
            },
        };
        const pw = {
            name: 'douyin-playwright',
            platform: 'douyin',
            healthCheck: async () => ({ ok: true }),
            resolve: async () => {
                throw new Error('n/a');
            },
            fetchStatus: async (uids) => {
                calls.push('pw');
                return uids.map((uid) => ({
                    platform: 'douyin',
                    platformUid: uid,
                    status: 'live',
                    title: '测试直播',
                    coverUrl: '',
                    liveUrl: `https://live.douyin.com/${uid}`,
                    provider: 'douyin-playwright',
                    fetchedAt: new Date(),
                    confidence: 0.9,
                }));
            },
        };
        const { results, allFailed } = await chain.executeChain([third, sign, pw], ['kelie329157']);
        expect(calls).toEqual(['third', 'sign', 'pw']);
        expect(allFailed).toBe(false);
        expect(results[0].status).toBe('live');
        expect(results[0].provider).toBe('douyin-playwright');
    });
    it('does not treat forged not_live skip path: real not_live from pw is success', async () => {
        const chain = new provider_chain_service_1.ProviderChainService();
        const third = {
            name: 'douyin-third-party',
            platform: 'douyin',
            healthCheck: async () => ({ ok: true }),
            resolve: async () => {
                throw new Error('n/a');
            },
            fetchStatus: async () => {
                throw new provider_skip_error_1.ProviderSkippedError('douyin-third-party', 'not configured');
            },
        };
        const pw = {
            name: 'douyin-playwright',
            platform: 'douyin',
            healthCheck: async () => ({ ok: true }),
            resolve: async () => {
                throw new Error('n/a');
            },
            fetchStatus: async (uids) => uids.map((uid) => ({
                platform: 'douyin',
                platformUid: uid,
                status: 'not_live',
                title: '',
                coverUrl: '',
                liveUrl: `https://live.douyin.com/${uid}`,
                provider: 'douyin-playwright',
                fetchedAt: new Date(),
                confidence: 0.9,
            })),
        };
        const { results, allFailed } = await chain.executeChain([third, pw], ['x']);
        expect(allFailed).toBe(false);
        expect(results[0].status).toBe('not_live');
    });
});
describe('isPlaywrightTargetCrashError', () => {
    const { isPlaywrightTargetCrashError } = require('./providers/douyin-browser.pool');
    it('detects renderer crash messages', () => {
        expect(isPlaywrightTargetCrashError(new Error('page.content: Target crashed'))).toBe(true);
        expect(isPlaywrightTargetCrashError(new Error('Target closed'))).toBe(true);
        expect(isPlaywrightTargetCrashError(new Error('timeout'))).toBe(false);
    });
});
//# sourceMappingURL=crawler-resolve.spec.js.map