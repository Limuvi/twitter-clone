import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { VerificationRepository } from './verification.repository';
import { VerificationService } from './verification.service';

@Module({
  imports: [RedisModule],
  exports: [VerificationService],
  providers: [VerificationService, VerificationRepository],
})
export class VerificationModule {}
