import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Blocked = 'Blocked',
  Completed = 'Completed',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  assignedTo!: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true, default: '' })
  description!: string;

  @Prop({ required: true, enum: TaskPriority, default: TaskPriority.Medium })
  priority!: TaskPriority;

  @Prop({ required: true, enum: TaskStatus, default: TaskStatus.ToDo })
  status!: TaskStatus;

  @Prop({ type: Date, default: null })
  dueDate!: Date | null;

  @Prop({ default: 0, min: 0, max: 100 })
  progress!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);
