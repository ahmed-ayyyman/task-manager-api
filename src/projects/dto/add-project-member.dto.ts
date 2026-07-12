import { IsIn, IsMongoId } from 'class-validator';
import { UserRole } from '../../users/user.schema';

export class AddProjectMemberDto {
  @IsMongoId()
  userId!: string;

  @IsIn([UserRole.Member, UserRole.Observer])
  role!: UserRole;
}
