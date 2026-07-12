import { IsEnum } from 'class-validator';
import { SubtaskStatus } from '../../tasks/task.schema';

export class UpdateSubtaskDto {
  @IsEnum(SubtaskStatus)
  status!: SubtaskStatus;
}
