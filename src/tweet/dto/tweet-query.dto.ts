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

export class TweetQueryDto {
  @IsOptional()
  @IsPositive()
  @Transform(castToNumber)
  page: number;

  @IsOptional()
  @IsPositive()
  @Transform(castToNumber)
  limit: number;

  @IsOptional()
  @IsUUID(undefined, { each: true })
  profileId: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isOnlyMedia: boolean;

  @IsOptional()
  @IsIn(['createdAt', 'likesNumber'])
  sortBy: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  orderBy: 'ASC' | 'DESC';
}
