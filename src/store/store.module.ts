import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { StoreRepository } from './store.repository';

@Module({
  imports: [RedisModule],
  exports: [StoreRepository],
  providers: [StoreRepository],
})
export class StoreModule {}
