import { IsEnum } from 'class-validator';
import { JoinRequestStatus } from '../join-request.schema';

export class UpdateJoinRequestDto {
  @IsEnum([JoinRequestStatus.Approved, JoinRequestStatus.Rejected])
  status: JoinRequestStatus;
}
