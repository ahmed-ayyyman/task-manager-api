import { IsString, MaxLength } from 'class-validator';

export class CreateSubtaskDto {
  @IsString()
  @MaxLength(200)
  title: string;
}
