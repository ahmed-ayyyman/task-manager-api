import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import { Project, ProjectSchema } from '../projects/project.schema';
import { JoinRequest, JoinRequestSchema } from './join-request.schema';
import { JoinRequestsController } from './join-requests.controller';
import { JoinRequestsService } from './join-requests.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JoinRequest.name, schema: JoinRequestSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [JoinRequestsController],
  providers: [JoinRequestsService],
})
export class JoinRequestsModule {}
