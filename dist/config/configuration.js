"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'livestream-monitoring',
    apiPort: parseInt(process.env.API_PORT || '4000', 10),
    workerMode: process.env.WORKER_MODE === 'true',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/livestream',
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    jwt: {
        clientSecret: process.env.JWT_CLIENT_SECRET || 'dev-client-secret-change-me-32chars',
        adminSecret: process.env.JWT_ADMIN_SECRET || 'dev-admin-secret-change-me-32chars',
        clientExpires: process.env.JWT_CLIENT_EXPIRES || '7d',
        adminExpires: process.env.JWT_ADMIN_EXPIRES || '1d',
    },
    wechat: {
        appId: process.env.WECHAT_APPID || '',
        secret: process.env.WECHAT_SECRET || '',
        token: process.env.WECHAT_TOKEN || 'dev-token',
        encodingAesKey: process.env.WECHAT_ENCODING_AES_KEY || '',
        subscribeTemplateId: process.env.WECHAT_SUBSCRIBE_TEMPLATE_ID || 'TMPL_LIVE_NOTIFY',
        miniProgramState: process.env.WECHAT_MINI_PROGRAM_STATE || 'developer',
    },
    quota: {
        maxBalance: parseInt(process.env.QUOTA_MAX_BALANCE || '200', 10),
    },
    douyin: {
        thirdPartyBaseUrl: process.env.DOUYIN_THIRD_PARTY_BASE_URL || '',
        thirdPartyApiKey: process.env.DOUYIN_THIRD_PARTY_API_KEY || '',
        playwrightTimeoutMs: parseInt(process.env.DOUYIN_PW_TIMEOUT_MS || '20000', 10),
        playwrightConcurrency: parseInt(process.env.DOUYIN_PW_CONCURRENCY || '1', 10),
        playwrightHeadless: process.env.DOUYIN_PW_HEADLESS !== 'false',
        playwrightExecutablePath: process.env.DOUYIN_PW_EXECUTABLE_PATH || '',
    },
    admin: {
        bootstrapUsername: process.env.ADMIN_BOOTSTRAP_USERNAME || 'admin',
        bootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'admin123456',
    },
    holidayApiUrl: process.env.HOLIDAY_API_URL || 'https://timor.tech/api/holiday/year',
    live: {
        minRebroadcastMinutes: parseInt(process.env.LIVE_MIN_REBROADCAST_MINUTES || '30', 10),
        confirmOfflinePolls: parseInt(process.env.LIVE_CONFIRM_OFFLINE_POLLS || '2', 10),
        probeFailForceOffline: parseInt(process.env.LIVE_PROBE_FAIL_FORCE_OFFLINE || '3', 10),
    },
    bullBoard: {
        token: process.env.BULL_BOARD_TOKEN || '',
    },
});
//# sourceMappingURL=configuration.js.map