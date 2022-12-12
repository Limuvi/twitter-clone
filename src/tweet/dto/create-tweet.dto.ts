import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTweetDto {
  @IsOptional()
  @IsString()
  text: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isPrivate: boolean;
}
