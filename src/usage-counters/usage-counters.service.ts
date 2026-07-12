import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UsageCounter,
  UsageCounterDocument,
} from './usage-counter.schema';

@Injectable()
export class UsageCountersService {
  constructor(
    @InjectModel(UsageCounter.name)
    private readonly usageCounterModel: Model<UsageCounterDocument>,
  ) {}

  async increment(
    entityType: string,
    entityId: string,
    metric: string,
    amount = 1,
  ) {
    return this.usageCounterModel
      .findOneAndUpdate(
        {
          entityType,
          entityId: new Types.ObjectId(entityId),
        },
        { $inc: { [`metrics.${metric}`]: amount } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async decrement(
    entityType: string,
    entityId: string,
    metric: string,
    amount = 1,
  ) {
    return this.increment(entityType, entityId, metric, -amount);
  }

  async get(entityType: string, entityId: string) {
    return this.usageCounterModel
      .findOne({
        entityType,
        entityId: new Types.ObjectId(entityId),
      })
      .exec();
  }

  async set(
    entityType: string,
    entityId: string,
    metrics: Record<string, number>,
  ) {
    return this.usageCounterModel
      .findOneAndUpdate(
        {
          entityType,
          entityId: new Types.ObjectId(entityId),
        },
        { $set: { metrics } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
