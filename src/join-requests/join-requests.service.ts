import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  JoinRequest,
  JoinRequestDocument,
  JoinRequestStatus,
} from './join-request.schema';
import { UpdateJoinRequestDto } from './dto/update-join-request.dto';
import { Project, ProjectDocument } from '../projects/project.schema';
import {
  ProjectMember,
  ProjectMemberDocument,
} from '../projects/project-member.schema';
import { UserRole } from '../users/user.schema';

@Injectable()
export class JoinRequestsService {
  constructor(
    @InjectModel(JoinRequest.name)
    private readonly joinRequestModel: Model<JoinRequestDocument>,
    @InjectModel(ProjectMember.name)
    private readonly projectMemberModel: Model<ProjectMemberDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(projectId: string, userId: string, userRole: UserRole) {
    if (userRole !== UserRole.Observer) {
      throw new ForbiddenException('Only Observers can request to join');
    }

    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existingMember = await this.projectMemberModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (existingMember) {
      throw new ConflictException('You are already a member of this project');
    }

    const pendingRequest = await this.joinRequestModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        observerId: new Types.ObjectId(userId),
        status: JoinRequestStatus.Pending,
      })
      .exec();

    if (pendingRequest) {
      throw new ConflictException('You already have a pending join request');
    }

    const joinRequest = await this.joinRequestModel.create({
      projectId: new Types.ObjectId(projectId),
      observerId: new Types.ObjectId(userId),
    });

    return joinRequest;
  }

  async findAll(projectId: string, userId: string) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.ensureProjectLeader(projectId, userId);

    return this.joinRequestModel
      .find({
        projectId: new Types.ObjectId(projectId),
        status: JoinRequestStatus.Pending,
      })
      .populate('observerId', 'name email')
      .exec();
  }

  async updateStatus(
    projectId: string,
    requestId: string,
    updateJoinRequestDto: UpdateJoinRequestDto,
    userId: string,
  ) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.ensureProjectLeader(projectId, userId);

    const joinRequest = await this.joinRequestModel.findById(requestId).exec();
    if (!joinRequest) {
      throw new NotFoundException('Join request not found');
    }

    if (joinRequest.status !== JoinRequestStatus.Pending) {
      throw new ConflictException('Join request has already been processed');
    }

    joinRequest.status = updateJoinRequestDto.status;
    await joinRequest.save();

    if (updateJoinRequestDto.status === JoinRequestStatus.Approved) {
      await this.projectMemberModel.findOneAndUpdate(
        {
          projectId: joinRequest.projectId,
          userId: joinRequest.observerId,
        },
        {
          projectId: joinRequest.projectId,
          userId: joinRequest.observerId,
          role: UserRole.Member,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    return joinRequest;
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
}
