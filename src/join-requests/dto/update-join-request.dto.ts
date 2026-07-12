import { IsIn } from 'class-validator';
import { JoinRequestStatus } from '../join-request.schema';

export class UpdateJoinRequestDto {
  @IsIn([JoinRequestStatus.Approved, JoinRequestStatus.Rejected])
  status: JoinRequestStatus;
}
