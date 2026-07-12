import {
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
import { ProjectMember, ProjectMemberDocument } from './project-member.schema';
import { UserRole } from '../users/user.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectMember.name)
    private readonly projectMemberModel: Model<ProjectMemberDocument>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async ensureProjectLeader(projectId: string, userId: string) {
    const membership = await this.projectMemberModel
      .findOne({ projectId, userId, role: UserRole.Leader })
      .exec();

    if (!membership) {
      throw new ForbiddenException('Leader access required');
    }
  }

  private async ensureProjectMembership(projectId: string, userId: string) {
    const membership = await this.projectMemberModel
      .findOne({ projectId, userId })
      .exec();

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }
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
    });

    await this.projectMemberModel.create({
      projectId: project._id,
      userId: leaderId,
      role: UserRole.Leader,
    });

    return project;
  }

  async findMyProjects(userId: string) {
    const memberships = await this.projectMemberModel
      .find({ userId })
      .populate('projectId')
      .exec();

    return memberships.map((membership) => ({
      membershipRole: membership.role,
      project: membership.projectId,
    }));
  }

  async findOne(projectId: string, userId: string) {
    await this.ensureProjectMembership(projectId, userId);
    const project = await this.projectModel.findById(projectId).exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const members = await this.projectMemberModel
      .find({ projectId })
      .populate('userId', 'name email role')
      .exec();

    return {
      project,
      members,
    };
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

    const member = await this.projectMemberModel.findOneAndUpdate(
      { projectId, userId: addProjectMemberDto.userId },
      {
        projectId,
        userId: addProjectMemberDto.userId,
        role: addProjectMemberDto.role,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await this.notificationsService.create(
      addProjectMemberDto.userId,
      'member_added',
      `You have been added to project "${project.name}" as ${addProjectMemberDto.role}`,
      currentUserId,
    );

    return member;
  }

  async listMembers(projectId: string, userId: string) {
    await this.ensureProjectMembership(projectId, userId);

    return this.projectMemberModel
      .find({ projectId })
      .populate('userId', 'name email role')
      .exec();
  }
}
