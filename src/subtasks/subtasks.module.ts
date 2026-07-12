import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { SubtasksController } from './subtasks.controller';

@Module({
  imports: [TasksModule],
  controllers: [SubtasksController],
})
export class SubtasksModule {}
