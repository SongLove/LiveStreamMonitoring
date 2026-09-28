import { Request, Response } from 'express';
import { WechatService } from './wechat.service';
import { ConfigService } from '@nestjs/config';
export declare class WechatController {
    private readonly wechatService;
    private readonly config;
    constructor(wechatService: WechatService, config: ConfigService);
    verify(query: Record<string, string>, res: Response): Response<any, Record<string, any>>;
    callback(req: Request, query: Record<string, string>, res: Response): Promise<Response<any, Record<string, any>>>;
    mockSubscribeAccept(user: {
        userId: string;
    }, body: {
        templateId?: string;
        status?: string;
    }): Promise<{
        granted: boolean;
        balance: number;
    } | {
        granted: boolean;
        reason: string;
        balance: null;
    }>;
}
