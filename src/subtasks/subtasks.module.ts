import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectMember, ProjectMemberSchema } from '../projects/project-member.schema';
import { Task, TaskSchema } from '../tasks/task.schema';
import { Subtask, SubtaskSchema } from './subtask.schema';
import { SubtasksController } from './subtasks.controller';
import { SubtasksService } from './subtasks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subtask.name, schema: SubtaskSchema },
      { name: Task.name, schema: TaskSchema },
      { name: ProjectMember.name, schema: ProjectMemberSchema },
    ]),
  ],
  controllers: [SubtasksController],
  providers: [SubtasksService],
})
export class SubtasksModule {}
