import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { StoreModule } from '../store/store.module';
import { SessionService } from './session.service';

@Module({
  imports: [RedisModule, StoreModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
