import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../users/user.schema';

class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: UserRole })
  role!: UserRole;

  @Prop({ default: Date.now })
  joinedAt!: Date;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true, default: '' })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  leaderId!: Types.ObjectId;

  @Prop({ type: [ProjectMemberSchema], default: [] })
  members!: Types.Subdocument<Types.ObjectId> & ProjectMember[];

  createdAt!: Date;
  updatedAt!: Date;
}

export type ProjectDocument = HydratedDocument<Project>;
export const ProjectSchema = SchemaFactory.createForClass(Project);
