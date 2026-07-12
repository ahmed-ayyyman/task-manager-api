import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Feedback, FeedbackDocument } from './feedback.schema';
import { Task, TaskDocument } from '../tasks/task.schema';
import { ProjectMember, ProjectMemberDocument } from '../projects/project-member.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @InjectModel(ProjectMember.name)
    private readonly projectMemberModel: Model<ProjectMemberDocument>,
  ) {}

  async create(taskId: string, createFeedbackDto: CreateFeedbackDto, userId: string) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.ensureProjectMember(task.projectId.toString(), userId);

    const feedback = await this.feedbackModel.create({
      taskId: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
      comment: createFeedbackDto.comment,
    });

    return feedback;
  }

  async findByTask(taskId: string, userId: string) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.ensureProjectMember(task.projectId.toString(), userId);

    return this.feedbackModel
      .find({ taskId: new Types.ObjectId(taskId) })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 })
      .exec();
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
