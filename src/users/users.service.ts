import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from './user.schema';

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private toSafeUser(user: UserDocument): SafeUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(input: {
    name: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
  }) {
    const user = await this.userModel.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.Member,
    });

    return this.toSafeUser(user);
  }

  async findByEmail(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel.findById(id).exec();
  }

  async getSafeById(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toSafeUser(user);
  }

  async ensureEmailIsFree(email: string) {
    const existingUser = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .exec();
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
  }
}
