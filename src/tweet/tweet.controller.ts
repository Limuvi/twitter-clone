import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Put,
  HttpCode,
} from '@nestjs/common';
import { TweetService } from './tweet.service';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { UpdateTweetDto } from './dto/update-tweet.dto';
import { CurrentUser } from '../common/decorators';
import { AuthGuard } from '../common/guards';
import { ERROR_MESSAGES, NotFoundError } from '../common/errors';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('tweets')
export class TweetController {
  constructor(private readonly tweetService: TweetService) {}

  @UseGuards(AuthGuard)
  @Post()
  async createTweet(
    @Body() dto: CreateTweetDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.tweetService.createTweet(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Post(':id/comments')
  async createComment(
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: number,
    @Param('id', new ParseUUIDPipe({ version: '4' })) parentId: string,
  ) {
    return await this.tweetService.createComment(parentId, userId, dto);
  }

  @UseGuards(AuthGuard)
  @Post(':id/retweets')
  async retweet(
    @Body() dto: CreateTweetDto,
    @CurrentUser('id') userId: number,
    @Param('id', new ParseUUIDPipe({ version: '4' })) parentId: string,
  ) {
    return await this.tweetService.createRetweet(parentId, userId, dto);
  }

  @Get()
  async findAll() {
    return await this.tweetService.findTweets();
  }

  @Get([':id', 'comments/:id'])
  async findTweetById(@Param('id') id: string) {
    const tweet = await this.tweetService.findById(id);

    if (!tweet) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    }

    return tweet;
  }

  @Get(':id/comments')
  async findCommentsTreeById(@Param('id') id: string) {
    return await this.tweetService.findDescendantsTreeById(id, true);
  }

  @Get(':id/retweets')
  async findRetweetsTreeById(@Param('id') id: string) {
    return await this.tweetService.findDescendantsTreeById(id, false);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async updateTweet(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateTweetDto,
  ) {
    return await this.tweetService.updateTweet(id, userId, dto);
  }

  @UseGuards(AuthGuard)
  @Put('comments/:id')
  async updateComment(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateCommentDto,
  ) {
    return await this.tweetService.updateComment(id, userId, dto);
  }

  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Delete([':id', 'comments/:id'])
  async delete(@Param('id') id: string, @CurrentUser('id') userId: number) {
    await this.tweetService.delete(id, userId);
    return;
  }
}
