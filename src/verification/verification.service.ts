import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { VerificationRepository } from './verification.repository';

@Injectable()
export class VerificationService {
  constructor(private verificationRepository: VerificationRepository) {}

  create(code: string, user: CreateUserDto): Promise<string> {
    return this.verificationRepository.create(code, user);
  }

  findByVerificationCode(code: string): Promise<CreateUserDto> {
    return this.verificationRepository.findByCode(code);
  }

  deleteVerificationCode(code: string): Promise<number> {
    return this.verificationRepository.delete(code);
  }
}
