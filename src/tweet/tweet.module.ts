import { Module } from '@nestjs/common';
import { TweetService } from './tweet.service';
import { TweetController } from './tweet.controller';
import { Tweet } from './entities/tweet.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileModule } from '../profile/profile.module';
import { Like } from './entities/tweet-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tweet, Like]), ProfileModule],
  controllers: [TweetController],
  providers: [TweetService],
})
export class TweetModule {}
