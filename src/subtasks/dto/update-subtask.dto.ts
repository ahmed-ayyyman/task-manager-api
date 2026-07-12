import { IsEnum } from 'class-validator';
import { SubtaskStatus } from '../subtask.schema';

export class UpdateSubtaskDto {
  @IsEnum(SubtaskStatus)
  status!: SubtaskStatus;
}
