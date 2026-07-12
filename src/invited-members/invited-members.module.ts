import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { Project, ProjectSchema } from '../projects/project.schema';
import {
  InvitedMember,
  InvitedMemberSchema,
} from './invited-member.schema';
import { InvitedMembersController } from './invited-members.controller';
import { InvitedMembersService } from './invited-members.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvitedMember.name, schema: InvitedMemberSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [InvitedMembersController],
  providers: [InvitedMembersService],
})
export class InvitedMembersModule {}
