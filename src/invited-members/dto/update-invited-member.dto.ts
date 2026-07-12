import { IsEnum } from 'class-validator';
import { InviteStatus } from '../invited-member.schema';

export class UpdateInvitedMemberDto {
  @IsEnum(InviteStatus)
  status!: InviteStatus;
}
