import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/types/auth-user.type';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findByUser(@CurrentUser() user: AuthUser) {
    return this.notificationsService.findByUser(user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') notificationId: string, @CurrentUser() user: AuthUser) {
    return this.notificationsService.markAsRead(notificationId, user.id);
  }
}
