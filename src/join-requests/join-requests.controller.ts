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
import { UpdateJoinRequestDto } from './dto/update-join-request.dto';
import { JoinRequestsService } from './join-requests.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class JoinRequestsController {
  constructor(
    private readonly joinRequestsService: JoinRequestsService,
  ) {}

  @Post(':id/join-request')
  create(@Param('id') projectId: string, @CurrentUser() user: AuthUser) {
    return this.joinRequestsService.create(projectId, user.id, user.role);
  }

  @Get(':id/join-requests')
  findAll(@Param('id') projectId: string, @CurrentUser() user: AuthUser) {
    return this.joinRequestsService.findAll(projectId, user.id);
  }

  @Patch(':id/join-requests/:requestId')
  updateStatus(
    @Param('id') projectId: string,
    @Param('requestId') requestId: string,
    @Body() updateJoinRequestDto: UpdateJoinRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.joinRequestsService.updateStatus(
      projectId,
      requestId,
      updateJoinRequestDto,
      user.id,
    );
  }
}
