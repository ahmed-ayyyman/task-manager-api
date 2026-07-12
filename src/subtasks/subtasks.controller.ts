import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/types/auth-user.type';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { SubtasksService } from './subtasks.service';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Post(':taskId/subtasks')
  create(
    @Param('taskId') taskId: string,
    @Body() createSubtaskDto: CreateSubtaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subtasksService.create(taskId, createSubtaskDto, user.id);
  }

  @Patch(':taskId/subtasks/:subtaskId')
  updateStatus(
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Body() updateSubtaskDto: UpdateSubtaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subtasksService.updateStatus(
      taskId,
      subtaskId,
      updateSubtaskDto,
      user.id,
    );
  }

  @Delete(':taskId/subtasks/:subtaskId')
  delete(
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subtasksService.delete(taskId, subtaskId, user.id);
  }
}
