import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum UserRole {
  Leader = 'Leader',
  Member = 'Member',
  Observer = 'Observer',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.Member })
  role!: UserRole;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
