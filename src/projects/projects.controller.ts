import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/types/auth-user.type';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(createProjectDto, user.id, user.role);
  }

  @Get()
  findMyProjects(@CurrentUser() user: AuthUser) {
    return this.projectsService.findMyProjects(user.id);
  }

  @Get(':id')
  findOne(@Param('id') projectId: string, @CurrentUser() user: AuthUser) {
    return this.projectsService.findOne(projectId, user.id);
  }

  @Post(':id/members')
  addMember(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthUser,
    @Body() addProjectMemberDto: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(
      projectId,
      user.id,
      addProjectMemberDto,
    );
  }

  @Get(':id/members')
  listMembers(@Param('id') projectId: string, @CurrentUser() user: AuthUser) {
    return this.projectsService.listMembers(projectId, user.id);
  }
}
