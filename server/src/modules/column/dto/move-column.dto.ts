import { IsIn } from 'class-validator';

export class MoveColumnDto {
  @IsIn(['up', 'down'])
  dir: 'up' | 'down';
}
