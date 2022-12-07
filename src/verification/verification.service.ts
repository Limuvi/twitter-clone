import { Injectable } from '@nestjs/common';
import { StoreRepository } from '../store/store.repository';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from '../user/entities/user.entity';
import { VerificationKey } from './types/verification-key.type';

@Injectable()
export class VerificationService {
  constructor(private repository: StoreRepository<User, VerificationKey>) {}

  create(code: string, user: CreateUserDto): Promise<string> {
    return this.repository.create({ code, email: user.email }, user);
  }

  async findByVerificationCode(code: string): Promise<CreateUserDto> {
    const users = await this.repository.find({ code, email: null });
    return users[0];
  }

  deleteVerificationCode(email: string, code: string): Promise<number> {
    return this.repository.deleteByKey({ code, email });
  }

  deleteByEmail(email: string) {
    return this.repository.deleteByPattern({ code: null, email });
  }
}
