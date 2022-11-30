import { IsNotEmpty, IsString } from 'class-validator';

export class VerificationDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
