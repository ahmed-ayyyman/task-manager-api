import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum InviteStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
}

@Schema({ timestamps: true })
export class InvitedMember {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId?: Types.ObjectId | null;

  @Prop({ required: true, enum: InviteStatus, default: InviteStatus.Pending })
  status!: InviteStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export type InvitedMemberDocument = HydratedDocument<InvitedMember>;
export const InvitedMemberSchema = SchemaFactory.createForClass(InvitedMember);
InvitedMemberSchema.index({ projectId: 1, email: 1 }, { unique: true });
