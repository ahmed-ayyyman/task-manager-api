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
import { NotificationsService } from '../notifications/notifications.service';
import { Project, ProjectDocument } from '../projects/project.schema';
import { UserRole } from '../users/user.schema';

@Injectable()
export class JoinRequestsService {
  constructor(
    @InjectModel(JoinRequest.name)
    private readonly joinRequestModel: Model<JoinRequestDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(projectId: string, userId: string, userRole: UserRole) {
    if (userRole !== UserRole.Observer) {
      throw new ForbiddenException('Only Observers can request to join');
    }

    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existingMember = project.members.some(
      (m) => m.userId.toString() === userId,
    );

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

    const leaderMember = project.members.find(
      (m) => m.role === UserRole.Leader,
    );

    if (leaderMember) {
      await this.notificationsService.create(
        leaderMember.userId.toString(),
        'join_request',
        'A new join request has been submitted to your project',
        userId,
      );
    }

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
      const alreadyMember = project.members.some(
        (m) => m.userId.toString() === joinRequest.observerId.toString(),
      );

      if (!alreadyMember) {
        await this.projectModel
          .findByIdAndUpdate(projectId, {
            $push: {
              members: {
                userId: joinRequest.observerId,
                role: UserRole.Member,
                joinedAt: new Date(),
              },
            },
          })
          .exec();
      }

      await this.notificationsService.create(
        joinRequest.observerId.toString(),
        'join_approved',
        `Your join request for project "${project.name}" has been approved`,
        userId,
      );
    } else {
      await this.notificationsService.create(
        joinRequest.observerId.toString(),
        'join_rejected',
        `Your join request for project "${project.name}" has been rejected`,
        userId,
      );
    }

    return joinRequest;
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
}
