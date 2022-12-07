import { Module } from '@nestjs/common';
import { StoreModule } from '../store/store.module';
import { VerificationService } from './verification.service';

@Module({
  imports: [StoreModule],
  exports: [VerificationService],
  providers: [VerificationService],
})
export class VerificationModule {}
