import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { VerificationRepository } from './verification.repository';

@Injectable()
export class VerificationService {
  constructor(private verificationRepository: VerificationRepository) {}

  create(code: string, user: CreateUserDto) {
    return this.verificationRepository.create(code, user);
  }

  findByVerificationCode(code: string) {
    return this.verificationRepository.findByCode(code);
  }

  deleteVerificationCode(code: string) {
    return this.verificationRepository.delete(code);
  }
}
