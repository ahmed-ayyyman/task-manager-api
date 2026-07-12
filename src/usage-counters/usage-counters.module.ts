import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UsageCounter,
  UsageCounterSchema,
} from './usage-counter.schema';
import { UsageCountersService } from './usage-counters.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsageCounter.name, schema: UsageCounterSchema },
    ]),
  ],
  providers: [UsageCountersService],
  exports: [UsageCountersService],
})
export class UsageCountersModule {}
