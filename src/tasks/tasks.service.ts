import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskDocument } from './task.schema';
import {
  ProjectMember,
  ProjectMemberDocument,
} from '../projects/project-member.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/user.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(ProjectMember.name)
    private readonly projectMemberModel: Model<ProjectMemberDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createTaskDto: CreateTaskDto,
    userId: string,
    userRole: UserRole,
  ) {
    if (userRole !== UserRole.Leader) {
      throw new ForbiddenException('Only Leaders can create tasks');
    }

    await this.ensureProjectLeader(createTaskDto.projectId, userId);

    const task = await this.taskModel.create({
      projectId: new Types.ObjectId(createTaskDto.projectId),
      title: createTaskDto.title,
      description: createTaskDto.description ?? '',
      priority: createTaskDto.priority,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
      createdBy: new Types.ObjectId(userId),
    });

    if (createTaskDto.assignedTo) {
      await this.notificationsService.create(
        createTaskDto.assignedTo,
        'task_assigned',
        `You have been assigned to task "${task.title}"`,
        userId,
      );
    }

    return task;
  }

  async findByProject(projectId: string, userId: string) {
    await this.ensureProjectMembership(projectId, userId);

    return this.taskModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .exec();
  }

  async findOne(taskId: string, userId: string) {
    const task = await this.taskModel
      .findById(taskId)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.ensureProjectMembership(task.projectId.toString(), userId);

    return task;
  }

  async update(
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
    userRole: UserRole,
  ) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (userRole === UserRole.Leader) {
      await this.ensureProjectLeader(task.projectId.toString(), userId);
    } else if (userRole === UserRole.Member) {
      await this.ensureProjectMembership(task.projectId.toString(), userId);

      const allowedKeys = ['status'];
      const attemptedKeys = Object.keys(updateTaskDto);
      const extraKeys = attemptedKeys.filter((k) => !allowedKeys.includes(k));

      if (extraKeys.length > 0) {
        throw new ForbiddenException('Members can only update task status');
      }
    } else {
      throw new ForbiddenException(
        'You do not have permission to update this task',
      );
    }

    const updateData: Record<string, unknown> = {};
    if (updateTaskDto.title !== undefined)
      updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined)
      updateData.description = updateTaskDto.description;
    if (updateTaskDto.priority !== undefined)
      updateData.priority = updateTaskDto.priority;
    if (updateTaskDto.status !== undefined)
      updateData.status = updateTaskDto.status;
    if (updateTaskDto.dueDate !== undefined) {
      updateData.dueDate = updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : null;
    }
    if (updateTaskDto.assignedTo !== undefined) {
      updateData.assignedTo = new Types.ObjectId(updateTaskDto.assignedTo);

      await this.notificationsService.create(
        updateTaskDto.assignedTo,
        'task_assigned',
        `You have been assigned to task "${task.title}"`,
        userId,
      );
    }

    const updated = await this.taskModel
      .findByIdAndUpdate(taskId, { $set: updateData }, { new: true })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .exec();

    return updated;
  }

  async delete(taskId: string, userId: string) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.ensureProjectLeader(task.projectId.toString(), userId);

    await this.taskModel.findByIdAndDelete(taskId).exec();
  }

  private async ensureProjectLeader(projectId: string, userId: string) {
    const membership = await this.projectMemberModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        userId: new Types.ObjectId(userId),
        role: UserRole.Leader,
      })
      .exec();

    if (!membership) {
      throw new ForbiddenException('Leader access required');
    }
  }

  private async ensureProjectMembership(projectId: string, userId: string) {
    const membership = await this.projectMemberModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }
  }
}
