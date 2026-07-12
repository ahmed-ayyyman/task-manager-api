import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/types/auth-user.type';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('task/:taskId')
  create(
    @Param('taskId') taskId: string,
    @Body() createFeedbackDto: CreateFeedbackDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.feedbackService.create(taskId, createFeedbackDto, user.id);
  }

  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser) {
    return this.feedbackService.findByTask(taskId, user.id);
  }
}
