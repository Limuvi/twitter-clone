import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { SessionRepository } from './session.repository';
import { SessionService } from './session.service';

@Module({
  imports: [RedisModule],
  providers: [SessionService, SessionRepository],
  exports: [SessionService],
})
export class SessionModule {}
