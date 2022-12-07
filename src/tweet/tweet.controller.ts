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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { TweetService } from './tweet.service';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { UpdateTweetDto } from './dto/update-tweet.dto';
import { CurrentUser } from '../common/decorators';
import { AuthGuard } from '../common/guards';
import { ERROR_MESSAGES, NotFoundError } from '../common/errors';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ImagesInterceptor } from '../common/interceptors/image.interceptor';
import { Tweet } from './entities/tweet.entity';
import { Like } from './entities/tweet-like.entity';

@Controller('tweets')
export class TweetController {
  constructor(private readonly tweetService: TweetService) {}

  @UseGuards(AuthGuard)
  @UseInterceptors(ImagesInterceptor())
  @Post()
  async createTweet(
    @Body() dto: CreateTweetDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
    @CurrentUser('id') userId: number,
  ): Promise<Tweet> {
    return await this.tweetService.createTweet(userId, dto, images);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(ImagesInterceptor())
  @Post(':id/comments')
  async createComment(
    @Body() dto: CreateCommentDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
    @CurrentUser('id') userId: number,
    @Param('id', new ParseUUIDPipe({ version: '4' })) parentId: string,
  ): Promise<Tweet> {
    return await this.tweetService.createComment(parentId, userId, dto, images);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(ImagesInterceptor())
  @Post(':id/retweets')
  async retweet(
    @Body() dto: CreateTweetDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
    @CurrentUser('id') userId: number,
    @Param('id', new ParseUUIDPipe({ version: '4' })) parentId: string,
  ): Promise<Tweet> {
    return await this.tweetService.createRetweet(parentId, userId, dto, images);
  }

  @UseGuards(AuthGuard)
  @Post(':id/likes')
  async createLike(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: number,
  ): Promise<Tweet> {
    return await this.tweetService.createLike(id, userId);
  }

  @Get()
  async findAll(): Promise<Tweet[]> {
    return await this.tweetService.findTweets();
  }

  @Get([':id', 'comments/:id'])
  async findTweetById(@Param('id') id: string): Promise<Tweet> {
    const tweet = await this.tweetService.findById(id);

    if (!tweet) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    }

    return tweet;
  }

  @Get(':id/comments')
  async findCommentsTreeById(@Param('id') id: string): Promise<any> {
    return await this.tweetService.findDescendantsTreeById(id, true);
  }

  @Get(':id/retweets')
  async findRetweetsTreeById(@Param('id') id: string): Promise<any> {
    return await this.tweetService.findDescendantsTreeById(id, false);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @UseInterceptors(ImagesInterceptor())
  async updateTweet(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateTweetDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    return await this.tweetService.updateTweet(id, userId, dto, images);
  }

  @UseGuards(AuthGuard)
  @Put('comments/:id')
  @UseInterceptors(ImagesInterceptor())
  async updateComment(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateCommentDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    return await this.tweetService.updateComment(id, userId, dto, images);
  }

  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Delete([':id', 'comments/:id'])
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ): Promise<void> {
    await this.tweetService.delete(id, userId);
    return;
  }

  @UseGuards(AuthGuard)
  // @HttpCode(204)
  @Delete(':id/likes')
  async deleteLike(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: number,
  ): Promise<Tweet> {
    return await this.tweetService.deleteLike(id, userId);
  }
}
