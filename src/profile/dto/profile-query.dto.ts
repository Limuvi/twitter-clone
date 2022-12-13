import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { castToNumber } from '../../common/helpers';

export class ProfileQueryDto {
  @IsOptional()
  @IsPositive()
  @Transform(castToNumber)
  page: number;

  @IsOptional()
  @IsPositive()
  @Transform(castToNumber)
  limit: number;

  @IsOptional()
  @IsIn(['username', 'numberOfFollowers'])
  sortBy: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderBy: 'ASC' | 'DESC';

  @IsOptional()
  username: string;
}
