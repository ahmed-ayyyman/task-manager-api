import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InvitedMember,
  InvitedMemberDocument,
  InviteStatus,
} from './invited-member.schema';
import { CreateInvitedMemberDto } from './dto/create-invited-member.dto';
import { UpdateInvitedMemberDto } from './dto/update-invited-member.dto';
import { Project, ProjectDocument } from '../projects/project.schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../users/user.schema';

@Injectable()
export class InvitedMembersService {
  constructor(
    @InjectModel(InvitedMember.name)
    private readonly invitedMemberModel: Model<InvitedMemberDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    projectId: string,
    createInvitedMemberDto: CreateInvitedMemberDto,
    invitedBy: string,
  ) {
    await this.ensureProjectLeader(projectId, invitedBy);

    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existing = await this.invitedMemberModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        email: createInvitedMemberDto.email.toLowerCase(),
        status: InviteStatus.Pending,
      })
      .exec();

    if (existing) {
      throw new ConflictException(
        'A pending invite already exists for this email',
      );
    }

    const user = await this.usersService.findByEmail(
      createInvitedMemberDto.email,
    );

    const invite = await this.invitedMemberModel.create({
      projectId: new Types.ObjectId(projectId),
      email: createInvitedMemberDto.email.toLowerCase(),
      invitedBy: new Types.ObjectId(invitedBy),
      userId: user ? user._id : null,
    });

    return invite;
  }

  async findByProject(projectId: string, userId: string) {
    await this.ensureProjectLeader(projectId, userId);

    return this.invitedMemberModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .populate('invitedBy', 'name email')
      .exec();
  }

  async updateStatus(
    inviteId: string,
    updateInvitedMemberDto: UpdateInvitedMemberDto,
    userId: string,
  ) {
    const invite = await this.invitedMemberModel.findById(inviteId).exec();
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email.toLowerCase() !== invite.email) {
      throw new ForbiddenException(
        'You can only respond to your own invites',
      );
    }

    if (invite.status !== InviteStatus.Pending) {
      throw new ConflictException('Invite has already been processed');
    }

    invite.status = updateInvitedMemberDto.status;
    await invite.save();

    if (updateInvitedMemberDto.status === InviteStatus.Accepted) {
      await this.projectModel
        .findByIdAndUpdate(invite.projectId, {
          $push: {
            members: {
              userId: new Types.ObjectId(userId),
              role: UserRole.Member,
              joinedAt: new Date(),
            },
          },
        })
        .exec();
    }

    await this.notificationsService.create(
      invite.invitedBy.toString(),
      'invite_response',
      `User "${user.name}" has ${updateInvitedMemberDto.status} the invite to your project`,
      userId,
    );

    return invite;
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
