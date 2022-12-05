import { IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @Length(1)
  @IsString()
  text: string;
}
