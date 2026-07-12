import { IsString, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @MaxLength(2000)
  comment: string;
}
