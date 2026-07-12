import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    receiverId: string,
    type: string,
    message: string,
    senderId?: string,
  ) {
    return this.notificationModel.create({
      receiverId: new Types.ObjectId(receiverId),
      type,
      message,
      senderId: senderId ? new Types.ObjectId(senderId) : null,
    });
  }

  async findByUser(userId: string) {
    return this.notificationModel
      .find({ receiverId: new Types.ObjectId(userId) })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, receiverId: new Types.ObjectId(userId) },
        { $set: { isRead: true } },
        { new: true },
      )
      .exec();
  }
}
