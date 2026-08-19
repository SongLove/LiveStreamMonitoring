import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAnchorCategory, UserAnchorCategorySchema } from './category.schema';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Subscription, SubscriptionSchema } from '../subscription/subscription.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAnchorCategory.name, schema: UserAnchorCategorySchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
  ],
  providers: [CategoryService],
  controllers: [CategoryController],
  exports: [CategoryService, MongooseModule],
})
export class CategoryModule {}
