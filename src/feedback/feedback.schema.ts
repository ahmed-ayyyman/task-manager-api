import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  comment!: string;

  createdAt!: Date;
}

export type FeedbackDocument = HydratedDocument<Feedback>;
export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
