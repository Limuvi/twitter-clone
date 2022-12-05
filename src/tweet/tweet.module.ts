import { Module } from '@nestjs/common';
import { TweetService } from './tweet.service';
import { TweetController } from './tweet.controller';
import { Tweet } from './entities/tweet.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tweet]), ProfileModule],
  controllers: [TweetController],
  providers: [TweetService],
})
export class TweetModule {}
