import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateSubtaskDto } from '../subtasks/dto/create-subtask.dto';
import { UpdateSubtaskDto } from '../subtasks/dto/update-subtask.dto';
import { Task, TaskDocument, SubtaskStatus } from './task.schema';
import { Project, ProjectDocument } from '../projects/project.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/user.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
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

  async createSubtask(
    taskId: string,
    createSubtaskDto: CreateSubtaskDto,
    userId: string,
  ) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.ensureProjectMembership(task.projectId.toString(), userId);

    const subtask = await this.taskModel
      .findByIdAndUpdate(
        taskId,
        {
          $push: {
            subtasks: { title: createSubtaskDto.title },
          },
        },
        { new: true },
      )
      .exec();

    await this.recalculateProgress(taskId);

    return subtask!.subtasks[subtask!.subtasks.length - 1];
  }

  async updateSubtaskStatus(
    taskId: string,
    subtaskId: string,
    updateSubtaskDto: UpdateSubtaskDto,
    userId: string,
  ) {
    const task = await this.taskModel.findOne({
      _id: taskId,
      'subtasks._id': subtaskId,
    }).exec();

    if (!task) {
      throw new NotFoundException('Task or subtask not found');
    }

    await this.ensureProjectMembership(task.projectId.toString(), userId);

    await this.taskModel
      .findOneAndUpdate(
        { _id: taskId, 'subtasks._id': subtaskId },
        { $set: { 'subtasks.$.status': updateSubtaskDto.status } },
        { new: true },
      )
      .exec();

    await this.recalculateProgress(taskId);

    const updated = await this.taskModel.findById(taskId).exec();
    return updated!.subtasks.find(
      (s) => s._id.toString() === subtaskId,
    );
  }

  async deleteSubtask(taskId: string, subtaskId: string, userId: string) {
    const task = await this.taskModel.findOne({
      _id: taskId,
      'subtasks._id': subtaskId,
    }).exec();

    if (!task) {
      throw new NotFoundException('Task or subtask not found');
    }

    await this.ensureProjectMembership(task.projectId.toString(), userId);

    await this.taskModel
      .findByIdAndUpdate(taskId, { $pull: { subtasks: { _id: subtaskId } } })
      .exec();

    await this.recalculateProgress(taskId);
  }

  private async recalculateProgress(taskId: string) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) return;

    const subtasks = task.subtasks;
    if (subtasks.length === 0) {
      await this.taskModel
        .findByIdAndUpdate(taskId, { $set: { progress: 0 } })
        .exec();
      return;
    }

    const completed = subtasks.filter(
      (s) => s.status === SubtaskStatus.Completed,
    ).length;

    const progress = Math.round((completed / subtasks.length) * 100);
    await this.taskModel
      .findByIdAndUpdate(taskId, { $set: { progress } })
      .exec();
  }

  private async ensureProjectLeader(projectId: string, userId: string) {
    const project = await this.projectModel
      .findOne({
        _id: projectId,
        members: {
          $elemMatch: {
            userId: new Types.ObjectId(userId),
            role: UserRole.Leader,
          },
        },
      })
      .exec();

    if (!project) {
      throw new ForbiddenException('Leader access required');
    }
  }

  private async ensureProjectMembership(projectId: string, userId: string) {
    const project = await this.projectModel
      .findOne({
        _id: projectId,
        'members.userId': new Types.ObjectId(userId),
      })
      .exec();

    if (!project) {
      throw new ForbiddenException('You are not a member of this project');
    }
  }
}
