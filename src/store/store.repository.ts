import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { IORedisKey } from '../redis/redis.module';

@Injectable()
export class StoreRepository<Entity, Key> {
  constructor(@Inject(IORedisKey) private readonly store: Redis) {}

  async findKeys(pattern): Promise<string[]> {
    const [cursor, keys] = await this.store.scan(0, 'MATCH', pattern);
    return keys;
  }

  getKey(key: Key): string {
    const entries = Object.entries(key).sort(([key1], [key2]) =>
      key1.localeCompare(key2, 'en', { sensitivity: 'base' }),
    );

    const pattern = entries.reduce((prev, curr) => {
      const key = curr[0],
        value = curr[1] || '*';
      prev += `${key}:${value}:`;
      return prev;
    }, '');

    return pattern.slice(0, -1);
  }

  async create(key: Key, value: any): Promise<string> {
    const str = this.getKey(key);
    await this.store.set(str, this.deserialize(value));
    return str;
  }

  async createWithTTL(
    key: Key,
    value: any,
    expirationTime: number,
  ): Promise<string> {
    const str = this.getKey(key);
    await this.store.set(str, this.deserialize(value), 'EX', expirationTime);
    return str;
  }

  async find(key: Key): Promise<Entity[]> {
    const keys = await this.findKeys(this.getKey(key));
    if (keys.length) {
      const values = await this.store.mget(keys);
      return keys.map((_, i) => this.serialize(values[i]));
    }
    return [];
  }

  async findByKey(key: Key): Promise<Entity> {
    const value = await this.store.get(this.getKey(key));
    const entity = this.serialize(value);
    return entity;
  }

  async deleteByKey(key: Key): Promise<number> {
    const count = await this.store.del(this.getKey(key));
    return count;
  }

  async deleteByPattern(key: Key): Promise<number> {
    const keys = await this.findKeys(this.getKey(key));

    if (keys.length) {
      const count = await this.store.del(keys);
      return count;
    }
    return 0;
  }

  private serialize(value: string): Entity {
    const entity = JSON.parse(value);
    return entity;
  }

  private deserialize(entity: any): string {
    const value = JSON.stringify(entity);
    return value;
  }
}
