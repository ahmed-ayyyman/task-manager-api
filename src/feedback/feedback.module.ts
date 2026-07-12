import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectMember, ProjectMemberSchema } from '../projects/project-member.schema';
import { Task, TaskSchema } from '../tasks/task.schema';
import { Feedback, FeedbackSchema } from './feedback.schema';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      { name: Task.name, schema: TaskSchema },
      { name: ProjectMember.name, schema: ProjectMemberSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
