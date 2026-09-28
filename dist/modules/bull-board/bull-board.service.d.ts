import { OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
export declare class BullBoardService implements OnModuleInit {
    private readonly httpAdapterHost;
    private readonly config;
    private readonly logger;
    constructor(httpAdapterHost: HttpAdapterHost, config: ConfigService);
    onModuleInit(): void;
}
