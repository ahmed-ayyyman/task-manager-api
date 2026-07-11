import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../users/user.schema';

@Schema({ timestamps: true })
export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: UserRole })
  role!: UserRole;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ProjectMemberDocument = HydratedDocument<ProjectMember>;
export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);
ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
