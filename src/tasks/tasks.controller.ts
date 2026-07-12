import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/types/auth-user.type';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto, user.id, user.role);
  }

  @Get('project/:projectId')
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.findByProject(projectId, user.id);
  }

  @Get(':id')
  findOne(@Param('id') taskId: string, @CurrentUser() user: AuthUser) {
    return this.tasksService.findOne(taskId, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.update(taskId, updateTaskDto, user.id, user.role);
  }

  @Delete(':id')
  delete(@Param('id') taskId: string, @CurrentUser() user: AuthUser) {
    return this.tasksService.delete(taskId, user.id);
  }
}
