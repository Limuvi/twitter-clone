import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { IORedisKey } from '../redis/redis.module';
import { CreateSessionData, Session } from './session.type';

@Injectable()
export class SessionRepository {
  constructor(@Inject(IORedisKey) private readonly store: Redis) {}

  private getKey(userId: string | number, token: string): string {
    return `userId:${userId}:token:${token}`;
  }

  private serialize(value: string): Session {
    const session: Session = JSON.parse(value);
    return session;
  }

  private deserialize(session: Session): string {
    const value = JSON.stringify(session);
    return value;
  }

  async create(sessionData: CreateSessionData, TTL: number): Promise<string> {
    const { userId, token, ...data } = sessionData;
    const expirationTime = new Date().getTime() + TTL * 1000;
    const key = this.getKey(userId, token);
    const session: Session = { ...data, userId, token, expirationTime };

    await this.store.set(key, this.deserialize(session), 'EX', TTL);
    return key;
  }

  private async findKeys(pattern): Promise<string[]> {
    const [cursor, keys] = await this.store.scan(0, 'MATCH', pattern);
    return keys;
  }

  async findByUserId(userId: number | string): Promise<Session[]> {
    const keys = await this.findKeys(this.getKey(userId, '*'));

    if (keys.length) {
      const values = await this.store.mget(keys);
      const sessions: Session[] = keys
        .map((_, i) => this.serialize(values[i]))
        .sort((a, b) => {
          return a.expirationTime - b.expirationTime;
        });

      return sessions;
    }
    return [];
  }

  async findByUserIdAndToken(
    userId: number | string,
    token: string,
  ): Promise<Session> {
    const key = this.getKey(userId, token);
    const value = await this.store.get(key);
    const session: Session = this.serialize(value);
    return session;
  }

  async delete(userId: string | number, token: string): Promise<number> {
    const key = this.getKey(userId, token);
    const count = await this.store.del(key);
    return count;
  }

  private async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.findKeys(pattern);
    const count = await this.store.del(keys);
    return count;
  }

  async deleteByUserId(userId: number | string): Promise<number> {
    return await this.deleteByPattern(this.getKey(userId, '*'));
  }
}
