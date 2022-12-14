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
  Query,
} from '@nestjs/common';
import { TweetService } from './tweet.service';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { UpdateTweetDto } from './dto/update-tweet.dto';
import { CurrentUser } from '../common/decorators';
import { AuthGuard } from '../common/guards';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ImagesInterceptor } from '../common/interceptors/image.interceptor';
import { Tweet } from './entities/tweet.entity';
import { TweetQueryDto } from './dto/tweet-query.dto';

@Controller('tweets')
export class TweetController {
  constructor(private readonly tweetService: TweetService) {}

  @UseGuards(AuthGuard)
  @UseInterceptors(ImagesInterceptor())
  @Post()
  async createTweet(
    @Body() dto: CreateTweetDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
    @CurrentUser('profileId') profileId: string,
  ): Promise<Tweet> {
    return await this.tweetService.createTweet(profileId, dto, images);
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(ImagesInterceptor())
  @Post(':id/comments')
  async createComment(
    @Body() dto: CreateCommentDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
    @CurrentUser('profileId') profileId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) parentId: string,
  ): Promise<Tweet> {
    return await this.tweetService.createComment(
      parentId,
      profileId,
      dto,
      images,
    );
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(ImagesInterceptor())
  @Post(':id/retweets')
  async retweet(
    @Body() dto: CreateTweetDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
    @CurrentUser('profileId') profileId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) parentId: string,
  ): Promise<Tweet> {
    return await this.tweetService.createRetweet(
      parentId,
      profileId,
      dto,
      images,
    );
  }

  @UseGuards(AuthGuard)
  @Post(':id/likes')
  async createLike(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('profileId') profileId: string,
  ): Promise<Tweet> {
    return await this.tweetService.addLike(id, profileId);
  }

  @UseGuards(AuthGuard)
  @Post(':id/bookmarks')
  async addBookmark(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('profileId') profileId: string,
  ): Promise<void> {    
    return await this.tweetService.addBookmark(id, profileId);
  }

  @Get()
  async findAll(
    @Query() query: TweetQueryDto,
    @CurrentUser('profileId') currentProfileId: string,
  ): Promise<Tweet[]> {
    const { page, limit, sortBy, orderBy, profileId, isOnlyMedia } = query;
    return await this.tweetService.findTweets(
      { page, limit },
      { sortBy, orderBy },
      profileId,
      isOnlyMedia,
      currentProfileId,
    );
  }

  @UseGuards(AuthGuard)
  @Get('followings')
  async findFollowingsTweets(
    @Query() query: TweetQueryDto,
    @CurrentUser('profileId') profileId: string,
  ): Promise<Tweet[]> {
    const { page, limit, sortBy, orderBy, isOnlyMedia } = query;
    return await this.tweetService.findFollowingsTweets(
      { page, limit },
      { sortBy, orderBy },
      profileId,
      isOnlyMedia,
    );
  }

  @UseGuards(AuthGuard)
  @Get('bookmarks')
  async getBookmarks(
    @CurrentUser('profileId') profileId: string,
  ): Promise<Tweet[]> {
    return await this.tweetService.findBookmarks(profileId);
  }

  @Get([':id', 'comments/:id'])
  async findTweetById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('profileId') profileId: string,
  ): Promise<Tweet> {
    const tweet = await this.tweetService.findById(id, profileId);

    return tweet;
  }

  @Get(':id/comments')
  async findCommentsTreeById(
    @Param('id') id: string,
    @CurrentUser('profileId') profileId: string,
    @Query() query: TweetQueryDto,
  ): Promise<any> {
    const { sortBy, orderBy } = query;
    return await this.tweetService.findDescendantsTreeById(
      id,
      true,
      {
        sortBy,
        orderBy,
      },
      profileId,
    );
  }

  @Get(':id/retweets')
  async findRetweetsTreeById(
    @Param('id') id: string,
    @CurrentUser('profileId') profileId: string,
    @Query() query: TweetQueryDto,
  ): Promise<any> {
    const { sortBy, orderBy } = query;
    return await this.tweetService.findDescendantsTreeById(
      id,
      false,
      {
        sortBy,
        orderBy,
      },
      profileId,
    );
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @UseInterceptors(ImagesInterceptor())
  async updateTweet(
    @Param('id') id: string,
    @CurrentUser('profileId') profileId: string,
    @Body() dto: UpdateTweetDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    return await this.tweetService.updateTweet(id, profileId, dto, images);
  }

  @UseGuards(AuthGuard)
  @Put('comments/:id')
  @UseInterceptors(ImagesInterceptor())
  async updateComment(
    @Param('id') id: string,
    @CurrentUser('profileId') profileId: string,
    @Body() dto: UpdateCommentDto,
    @UploadedFiles() images: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    return await this.tweetService.updateComment(id, profileId, dto, images);
  }

  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Delete([':id', 'comments/:id'])
  async delete(
    @Param('id') id: string,
    @CurrentUser('profileId') profileId: string,
  ): Promise<void> {
    await this.tweetService.delete(id, profileId);
    return;
  }

  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Delete(':id/bookmarks')
  async deleteBookmark(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('profileId') profileId: string,
  ): Promise<void> {
    return await this.tweetService.deleteBookmark(id, profileId);
  }

  @UseGuards(AuthGuard)
  // @HttpCode(204)
  @Delete(':id/likes')
  async deleteLike(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('profileId') profileId: string,
  ): Promise<Tweet> {
    return await this.tweetService.deleteLike(id, profileId);
  }
}
