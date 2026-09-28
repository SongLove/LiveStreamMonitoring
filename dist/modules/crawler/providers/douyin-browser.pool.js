"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DouyinBrowserPool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DouyinBrowserPool = void 0;
exports.isPlaywrightTargetCrashError = isPlaywrightTargetCrashError;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
function isPlaywrightTargetCrashError(err) {
    const msg = err?.message || String(err);
    return /target crashed|target closed|browser has been closed|session closed|page crashed/i.test(msg);
}
let DouyinBrowserPool = DouyinBrowserPool_1 = class DouyinBrowserPool {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(DouyinBrowserPool_1.name);
        this.browser = null;
        this.active = 0;
        this.waitQueue = [];
    }
    get concurrency() {
        return Math.max(1, this.config.get('douyin.playwrightConcurrency') || 1);
    }
    get navigationTimeoutMs() {
        return this.config.get('douyin.playwrightTimeoutMs') || 20_000;
    }
    get pageTimeoutMs() {
        return this.navigationTimeoutMs;
    }
    get headless() {
        return this.config.get('douyin.playwrightHeadless') !== false;
    }
    get executablePath() {
        const p = (this.config.get('douyin.playwrightExecutablePath') || '').trim();
        return p || undefined;
    }
    async onModuleDestroy() {
        await this.close();
    }
    async close() {
        if (this.browser) {
            try {
                await this.browser.close();
            }
            catch (e) {
                this.logger.warn(`browser close: ${e.message}`);
            }
        }
        this.browser = null;
    }
    async ensureBrowser() {
        if (this.browser?.isConnected())
            return this.browser;
        const { chromium } = await Promise.resolve().then(() => __importStar(require('playwright')));
        const execPath = this.executablePath;
        this.logger.log(execPath
            ? `launch chromium executablePath=${execPath}`
            : 'launch playwright-bundled chromium');
        this.browser = await chromium.launch({
            headless: this.headless,
            executablePath: execPath,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-accelerated-2d-canvas',
                '--disable-background-networking',
                '--disable-breakpad',
            ],
        });
        this.browser.on('disconnected', () => {
            this.logger.warn('chromium disconnected');
            this.browser = null;
        });
        return this.browser;
    }
    async newContext(browser) {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            locale: 'zh-CN',
            viewport: { width: 1280, height: 720 },
        });
        await context.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (type === 'image' || type === 'media') {
                return route.abort();
            }
            return route.continue();
        });
        return context;
    }
    async acquireSlot(waitMs) {
        if (this.active < this.concurrency) {
            this.active += 1;
            return;
        }
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.waitQueue = this.waitQueue.filter((fn) => fn !== grant);
                reject(new Error('Playwright 忙碌超时，请稍后重试'));
            }, waitMs);
            const grant = () => {
                clearTimeout(timer);
                this.active += 1;
                resolve();
            };
            this.waitQueue.push(grant);
        });
    }
    releaseSlot() {
        this.active = Math.max(0, this.active - 1);
        const next = this.waitQueue.shift();
        if (next)
            next();
    }
    async withPage(fn) {
        const waitMs = this.navigationTimeoutMs;
        await this.acquireSlot(waitMs);
        try {
            try {
                return await this.runWithPage(fn);
            }
            catch (err) {
                if (!isPlaywrightTargetCrashError(err))
                    throw err;
                this.logger.warn(`Playwright target crashed, relaunching browser: ${err.message}`);
                await this.close();
                return await this.runWithPage(fn);
            }
        }
        finally {
            this.releaseSlot();
        }
    }
    async runWithPage(fn) {
        let context = null;
        try {
            const browser = await this.ensureBrowser();
            context = await this.newContext(browser);
            const page = await context.newPage();
            page.setDefaultTimeout(this.navigationTimeoutMs);
            return await fn(page, context);
        }
        finally {
            try {
                await context?.close();
            }
            catch {
            }
        }
    }
};
exports.DouyinBrowserPool = DouyinBrowserPool;
exports.DouyinBrowserPool = DouyinBrowserPool = DouyinBrowserPool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DouyinBrowserPool);
//# sourceMappingURL=douyin-browser.pool.js.map