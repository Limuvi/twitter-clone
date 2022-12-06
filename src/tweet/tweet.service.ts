import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, TreeRepository } from 'typeorm';
import {
  AccessDeniedError,
  ERROR_MESSAGES,
  NotFoundError,
} from '../common/errors';
import { ProfileService } from '../profile/profile.service';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateTweetDto } from './dto/update-tweet.dto';
import { Tweet } from './entities/tweet.entity';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Like } from './entities/tweet-like.entity';
import { FileService } from '../file/file.service';

@Injectable()
export class TweetService {
  constructor(
    @InjectRepository(Tweet)
    private tweetsRepository: TreeRepository<Tweet>,
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    private profilesService: ProfileService,
    private filesService: FileService,
  ) {}

  createComment(
    parentId: string,
    userId: number,
    dto: CreateCommentDto,
    images?: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    return this.create(parentId, true, userId, dto, images);
  }

  createRetweet(
    parentId: string,
    userId: number,
    dto: CreateTweetDto,
    images?: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    return this.create(parentId, false, userId, dto, images);
  }

  createTweet(
    userId: number,
    dto: CreateTweetDto,
    images?: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    return this.create(null, false, userId, dto, images);
  }

  async create(
    parentId: string,
    isComment: boolean,
    userId: number,
    dto: CreateCommentDto | CreateTweetDto,
    images?: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    const profile = await this.profilesService.findByUserId(userId);

    if (!profile) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    if (parentId) {
      const parentRecord = await this.findById(parentId);

      if (!parentRecord) {
        throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
      }

      const imageNames = images.length
        ? await this.filesService.create(images)
        : [];

      return await this.tweetsRepository.save({
        ...dto,
        isComment,
        author: profile,
        parentRecord,
        parentAuthor: parentRecord.author,
        imageNames,
      });
    }

    const imageNames = images.length
      ? await this.filesService.create(images)
      : [];

    return await this.tweetsRepository.save({
      ...dto,
      isComment,
      author: { id: profile.id },
      imageNames,
    });
  }

  async createLike(id: string, userId: number): Promise<Like> {
    const tweet = await this.findById(id);
    const profile = await this.profilesService.findByUserId(userId);

    if (!tweet) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    } else if (!profile) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }
    const { id: tweetId } = tweet;
    const { id: profileId } = profile;
    const like = await this.likesRepository
      .createQueryBuilder('like')
      .where('like.profile.id = :profileId', { profileId })
      .andWhere('like.tweetId = :tweetId', { tweetId })
      .getOne();

    if (like) {
      return like;
    } else {
      return await this.likesRepository.save({
        tweet: { id: tweetId },
        profile: { id: profileId },
      });
    }
  }

  async findTweets(): Promise<Tweet[]> {
    return await this.tweetsRepository.find({
      where: { isComment: false },
      relations: {
        author: true,
        parentRecord: true,
        parentAuthor: true,
      },
    });
  }

  findById(id: string): Promise<Tweet> {
    return this.tweetsRepository.findOne({
      where: { id },
      relations: { author: true, parentRecord: true, parentAuthor: true },
    });
  }

  findByAuthorId(id: string): Promise<Tweet[]> {
    return this.tweetsRepository.findBy({ author: { id } });
  }

  async findDescendantsTreeById(id: string, isComment: boolean): Promise<any> {
    const tweet = await this.findById(id);

    if (!tweet) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    }

    const tweets = await this.tweetsRepository
      .createDescendantsQueryBuilder('tweet', 'tweetClosure', tweet)
      .leftJoinAndSelect('tweet.author', 'authors')
      .leftJoinAndSelect('tweet.parentRecord', 'parentRecord')
      .leftJoinAndSelect('tweet.parentAuthor', 'parentAuthor')
      .andWhere({
        isComment,
      })
      .andWhere([
        {
          parentRecord: { isComment },
        },
        {
          parentRecord: { id: tweet.id },
        },
      ])
      .orderBy('tweet.createdAt', 'ASC')
      .getMany();

    const tweetsTree = this.mapToTree(tweets);

    return tweetsTree;
  }

  async updateTweet(
    id: string,
    userId: number,
    dto: UpdateTweetDto,
    images: Array<Express.Multer.File>,
  ) {
    return await this.update(id, userId, false, dto, images);
  }

  async updateComment(
    id: string,
    userId: number,
    dto: UpdateTweetDto,
    images: Array<Express.Multer.File>,
  ) {
    return await this.update(id, userId, true, dto, images);
  }

  async update(
    id: string,
    userId: number,
    isComment: boolean,
    dto: UpdateTweetDto | UpdateCommentDto,
    images: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    const tweet = await this.findById(id);
    const profile = await this.profilesService.findByUserId(userId);

    if (!tweet || tweet.isComment !== isComment) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    } else if (!profile) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    } else if (tweet.authorId !== profile.id) {
      throw new AccessDeniedError();
    }

    const imageNames = images
      ? await this.filesService.replace(images, tweet.imageNames)
      : tweet.imageNames;

    const updated = await this.tweetsRepository.save({
      ...tweet,
      ...dto,
      imageNames,
    });

    delete updated.parentRecord;
    delete updated.parentAuthor;
    delete updated.author;

    return updated;
  }

  async delete(id: string, userId: number): Promise<DeleteResult> {
    const tweet = await this.findById(id);
    const profile = await this.profilesService.findByUserId(userId);

    if (!tweet) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    } else if (!profile) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    } else if (tweet.authorId !== profile.id) {
      throw new AccessDeniedError();
    }
    const { imageNames } = tweet;

    if (imageNames.length) {
      await this.filesService.delete(imageNames);
    }

    return await this.tweetsRepository.delete({ id });
  }

  async deleteLike(id: string, userId: number): Promise<Like> {
    const tweet = await this.findById(id);
    const profile = await this.profilesService.findByUserId(userId);

    if (!tweet) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    } else if (!profile) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }
    const { id: tweetId } = tweet;
    const { id: profileId } = profile;
    const like = await this.likesRepository
      .createQueryBuilder('like')
      .where('like.profile.id = :profileId', { profileId })
      .andWhere('like.tweetId = :tweetId', { tweetId })
      .getOne();

    if (like) {
      await this.likesRepository.delete(like.id);
    }

    return null;
  }

  protected mapToTree(dataset: Tweet[]): any[] {
    const hashTable = Object.create(null);
    dataset.forEach((data) => (hashTable[data.id] = { ...data, replies: [] }));
    const dataTree = [];

    dataset.forEach((el) => {
      const { id, parentRecord } = el;
      if (hashTable[parentRecord?.id]) {
        hashTable[parentRecord.id].replies.push(hashTable[id]);
      } else {
        dataTree.push(hashTable[id]);
      }
      delete hashTable[id].parentAuthor;
      delete hashTable[id].parentRecord;
    });
    return dataTree;
  }
}
