import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: false, updatedAt: true } })
export class UsageCounter {
  @Prop({ required: true })
  entityType!: string;

  @Prop({ type: Types.ObjectId, required: true })
  entityId!: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metrics!: Record<string, number>;

  updatedAt!: Date;
}

export type UsageCounterDocument = HydratedDocument<UsageCounter>;
export const UsageCounterSchema = SchemaFactory.createForClass(UsageCounter);
UsageCounterSchema.index({ entityType: 1, entityId: 1 }, { unique: true });
