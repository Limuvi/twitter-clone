import { Inject, Injectable } from '@tsed/common';
import Redis from 'ioredis';
import { IORedisKey } from '../redis/redis.module';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class VerificationRepository {
  constructor(@Inject(IORedisKey) private readonly store: Redis) {}

  private getKey(emailCode: string | number): string {
    return `emailCode:${emailCode}`;
  }

  private serialize(value: string): User {
    const user: User = JSON.parse(value);
    return user;
  }

  private deserialize(user: CreateUserDto): string {
    const value = JSON.stringify(user);
    return value;
  }

  async create(code: string, user: CreateUserDto): Promise<string> {
    const key = this.getKey(code);

    await this.store.set(key, this.deserialize(user));
    return key;
  }

  async findByCode(code: string): Promise<CreateUserDto> {
    const key = this.getKey(code);
    const value = await this.store.get(key);
    const user: CreateUserDto = this.serialize(value);
    return user;
  }

  async delete(emailCode: string): Promise<number> {
    const key = this.getKey(emailCode);
    const count = await this.store.del(key);
    return count;
  }
}
