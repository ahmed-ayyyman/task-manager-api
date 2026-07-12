import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum SubtaskStatus {
  ToDo = 'To Do',
  Completed = 'Completed',
}

@Schema({ timestamps: true })
export class Subtask {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, enum: SubtaskStatus, default: SubtaskStatus.ToDo })
  status!: SubtaskStatus;

  createdAt!: Date;
  updatedAt!: Date;
}

export type SubtaskDocument = HydratedDocument<Subtask>;
export const SubtaskSchema = SchemaFactory.createForClass(Subtask);
