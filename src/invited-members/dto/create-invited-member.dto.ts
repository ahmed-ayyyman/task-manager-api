import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateInvitedMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
