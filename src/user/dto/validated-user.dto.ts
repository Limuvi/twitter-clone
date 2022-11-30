import { OmitType } from '@nestjs/mapped-types';
import { User } from '../entities/user.entity';

export class ValidatedUserDto extends OmitType(User, [
  'hashedPassword',
] as const) {}
