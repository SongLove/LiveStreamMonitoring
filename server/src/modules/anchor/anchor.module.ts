import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Anchor, AnchorSchema } from './anchor.schema';
import { AnchorService } from './anchor.service';
import { AnchorController } from './anchor.controller';
import { CrawlerModule } from '../crawler/crawler.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Anchor.name, schema: AnchorSchema }]),
    forwardRef(() => CrawlerModule),
  ],
  providers: [AnchorService],
  controllers: [AnchorController],
  exports: [AnchorService, MongooseModule],
})
export class AnchorModule {}
