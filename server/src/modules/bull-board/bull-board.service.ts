import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { ALL_QUEUE_NAMES } from '../../common/constants/queues';

@Injectable()
export class BullBoardService implements OnModuleInit {
  private readonly logger = new Logger(BullBoardService.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const app = this.httpAdapterHost.httpAdapter.getInstance();
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    const redis = {
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
    };

    const queues = ALL_QUEUE_NAMES.map(
      (name) => new BullMQAdapter(new Queue(name, { connection: redis })),
    );

    createBullBoard({ queues, serverAdapter });

    const token = this.config.get<string>('bullBoard.token') || '';
    app.use('/admin/queues', (req: any, res: any, next: any) => {
      // Simple token gate; production should put behind Admin JWT / VPN
      if (token) {
        const provided = req.headers['x-bull-board-token'] || req.query.token;
        if (provided !== token) {
          return res.status(401).send('Unauthorized — provide x-bull-board-token or Admin network access');
        }
      }
      return next();
    });
    app.use('/admin/queues', serverAdapter.getRouter());
    this.logger.log('Bull Board mounted at /admin/queues');
  }
}
