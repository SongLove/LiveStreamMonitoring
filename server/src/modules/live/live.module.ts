import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { LiveSession, LiveSessionSchema } from './live-session.schema';
import { Anchor, AnchorSchema } from '../anchor/anchor.schema';
import { LiveService } from './live.service';
import { LiveController } from './live.controller';
import { QUEUE_NAMES } from '../../common/constants/queues';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LiveSession.name, schema: LiveSessionSchema },
      { name: Anchor.name, schema: AnchorSchema },
    ]),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.NOTIFY_DISPATCH },
      { name: QUEUE_NAMES.POLL_CONFIRM },
    ),
  ],
  providers: [LiveService],
  controllers: [LiveController],
  exports: [LiveService, MongooseModule],
})
export class LiveModule {}
