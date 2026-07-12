import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Project, ProjectDocument } from './project.schema';
import { UserRole } from '../users/user.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async ensureProjectLeader(projectId: string, userId: string) {
    const project = await this.projectModel
      .findOne({
        _id: projectId,
        members: {
          $elemMatch: { userId: new Types.ObjectId(userId), role: UserRole.Leader },
        },
      })
      .exec();

    if (!project) {
      throw new ForbiddenException('Leader access required');
    }

    return project;
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

    return project;
  }

  async create(
    createProjectDto: CreateProjectDto,
    leaderId: string,
    leaderRole: UserRole,
  ) {
    if (leaderRole !== UserRole.Leader) {
      throw new ForbiddenException('Leader role required');
    }

    const project = await this.projectModel.create({
      name: createProjectDto.name,
      description: createProjectDto.description ?? '',
      leaderId: new Types.ObjectId(leaderId),
      members: [
        {
          userId: new Types.ObjectId(leaderId),
          role: UserRole.Leader,
          joinedAt: new Date(),
        },
      ],
    });

    return project;
  }

  async findMyProjects(userId: string) {
    const projects = await this.projectModel
      .find({ 'members.userId': new Types.ObjectId(userId) })
      .exec();

    return projects.map((p) => {
      const membership = p.members.find(
        (m) => m.userId.toString() === userId,
      );
      return {
        membershipRole: membership!.role,
        project: p,
      };
    });
  }

  async findOne(projectId: string, userId: string) {
    const project = await this.ensureProjectMembership(projectId, userId);

    const memberIds = project.members.map((m) => m.userId);
    const users = await this.usersService.findByIds(
      memberIds,
      'name email role',
    );

    const members = project.members.map((m) => ({
      userId: users.find((u) => u._id.equals(m.userId)) || m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return { project, members };
  }

  async addMember(
    projectId: string,
    currentUserId: string,
    addProjectMemberDto: AddProjectMemberDto,
  ) {
    await this.ensureProjectLeader(projectId, currentUserId);

    if (addProjectMemberDto.role === UserRole.Leader) {
      throw new ForbiddenException(
        'Leader membership is managed automatically',
      );
    }

    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const user = await this.usersService.findById(addProjectMemberDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const alreadyMember = project.members.some(
      (m) => m.userId.toString() === addProjectMemberDto.userId,
    );

    if (alreadyMember) {
      throw new ConflictException('User is already a member of this project');
    }

    await this.projectModel
      .findByIdAndUpdate(projectId, {
        $push: {
          members: {
            userId: new Types.ObjectId(addProjectMemberDto.userId),
            role: addProjectMemberDto.role,
            joinedAt: new Date(),
          },
        },
      })
      .exec();

    await this.notificationsService.create(
      addProjectMemberDto.userId,
      'member_added',
      `You have been added to project "${project.name}" as ${addProjectMemberDto.role}`,
      currentUserId,
    );

    return project;
  }

  async listMembers(projectId: string, userId: string) {
    const project = await this.ensureProjectMembership(projectId, userId);

    const memberIds = project.members.map((m) => m.userId);
    const users = await this.usersService.findByIds(
      memberIds,
      'name email role',
    );

    return project.members.map((m) => ({
      userId: users.find((u) => u._id.equals(m.userId)) || m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }
}
