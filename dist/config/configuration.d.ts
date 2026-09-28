declare const _default: () => {
    nodeEnv: string;
    appName: string;
    apiPort: number;
    workerMode: boolean;
    mongodbUri: string;
    redis: {
        host: string;
        port: number;
    };
    jwt: {
        clientSecret: string;
        adminSecret: string;
        clientExpires: string;
        adminExpires: string;
    };
    wechat: {
        appId: string;
        secret: string;
        token: string;
        encodingAesKey: string;
        subscribeTemplateId: string;
        miniProgramState: string;
    };
    quota: {
        maxBalance: number;
    };
    douyin: {
        thirdPartyBaseUrl: string;
        thirdPartyApiKey: string;
        playwrightTimeoutMs: number;
        playwrightConcurrency: number;
        playwrightHeadless: boolean;
        playwrightExecutablePath: string;
    };
    admin: {
        bootstrapUsername: string;
        bootstrapPassword: string;
    };
    holidayApiUrl: string;
    live: {
        minRebroadcastMinutes: number;
        confirmOfflinePolls: number;
        probeFailForceOffline: number;
    };
    bullBoard: {
        token: string;
    };
};
export default _default;
