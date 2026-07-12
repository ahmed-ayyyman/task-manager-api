import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/types/auth-user.type';
import { CreateInvitedMemberDto } from './dto/create-invited-member.dto';
import { UpdateInvitedMemberDto } from './dto/update-invited-member.dto';
import { InvitedMembersService } from './invited-members.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class InvitedMembersController {
  constructor(
    private readonly invitedMembersService: InvitedMembersService,
  ) {}

  @Post('projects/:id/invites')
  create(
    @Param('id') projectId: string,
    @Body() createInvitedMemberDto: CreateInvitedMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invitedMembersService.create(
      projectId,
      createInvitedMemberDto,
      user.id,
    );
  }

  @Get('projects/:id/invites')
  findByProject(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invitedMembersService.findByProject(projectId, user.id);
  }

  @Patch('invites/:inviteId')
  updateStatus(
    @Param('inviteId') inviteId: string,
    @Body() updateInvitedMemberDto: UpdateInvitedMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invitedMembersService.updateStatus(
      inviteId,
      updateInvitedMemberDto,
      user.id,
    );
  }
}
