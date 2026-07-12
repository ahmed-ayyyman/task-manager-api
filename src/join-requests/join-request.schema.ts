import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum JoinRequestStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class JoinRequest {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  observerId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: JoinRequestStatus,
    default: JoinRequestStatus.Pending,
  })
  status!: JoinRequestStatus;

  createdAt!: Date;
}

export type JoinRequestDocument = HydratedDocument<JoinRequest>;
export const JoinRequestSchema = SchemaFactory.createForClass(JoinRequest);
