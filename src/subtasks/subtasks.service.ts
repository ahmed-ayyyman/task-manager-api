import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { Subtask, SubtaskDocument, SubtaskStatus } from './subtask.schema';
import { Task, TaskDocument } from '../tasks/task.schema';
import { ProjectMember, ProjectMemberDocument } from '../projects/project-member.schema';

@Injectable()
export class SubtasksService {
  constructor(
    @InjectModel(Subtask.name)
    private readonly subtaskModel: Model<SubtaskDocument>,
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @InjectModel(ProjectMember.name)
    private readonly projectMemberModel: Model<ProjectMemberDocument>,
  ) {}

  async create(taskId: string, createSubtaskDto: CreateSubtaskDto, userId: string) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.ensureProjectMember(task.projectId.toString(), userId);

    const subtask = await this.subtaskModel.create({
      taskId: new Types.ObjectId(taskId),
      title: createSubtaskDto.title,
    });

    await this.recalculateProgress(taskId);

    return subtask;
  }

  async updateStatus(
    taskId: string,
    subtaskId: string,
    updateSubtaskDto: UpdateSubtaskDto,
    userId: string,
  ) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.ensureProjectMember(task.projectId.toString(), userId);

    const subtask = await this.subtaskModel
      .findOneAndUpdate(
        { _id: subtaskId, taskId: new Types.ObjectId(taskId) },
        { $set: { status: updateSubtaskDto.status } },
        { new: true },
      )
      .exec();

    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    await this.recalculateProgress(taskId);

    return subtask;
  }

  async delete(taskId: string, subtaskId: string, userId: string) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.ensureProjectMember(task.projectId.toString(), userId);

    const subtask = await this.subtaskModel
      .findOneAndDelete({ _id: subtaskId, taskId: new Types.ObjectId(taskId) })
      .exec();

    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    await this.recalculateProgress(taskId);
  }

  private async recalculateProgress(taskId: string) {
    const total = await this.subtaskModel.countDocuments({
      taskId: new Types.ObjectId(taskId),
    });

    if (total === 0) {
      await this.taskModel.findByIdAndUpdate(taskId, { $set: { progress: 0 } }).exec();
      return;
    }

    const completed = await this.subtaskModel.countDocuments({
      taskId: new Types.ObjectId(taskId),
      status: SubtaskStatus.Completed,
    });

    const progress = Math.round((completed / total) * 100);
    await this.taskModel.findByIdAndUpdate(taskId, { $set: { progress } }).exec();
  }

  private async ensureProjectMember(projectId: string, userId: string) {
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
