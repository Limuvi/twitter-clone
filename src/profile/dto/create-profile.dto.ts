import { IsString, Length } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @Length(3, 30)
  username: string;

  @IsString()
  description: string;
}
