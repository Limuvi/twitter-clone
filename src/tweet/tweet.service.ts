import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, TreeRepository } from 'typeorm';
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

@Injectable()
export class TweetService {
  constructor(
    @InjectRepository(Tweet)
    private tweetsRepository: TreeRepository<Tweet>,
    private profilesService: ProfileService,
  ) {}

  createComment(
    parentId: string,
    userId: number,
    dto: CreateCommentDto,
  ): Promise<Tweet> {
    return this.create(parentId, true, userId, dto);
  }

  createRetweet(
    parentId: string,
    userId: number,
    dto: CreateTweetDto,
  ): Promise<Tweet> {
    return this.create(parentId, false, userId, dto);
  }

  createTweet(userId, dto: CreateTweetDto): Promise<Tweet> {
    return this.create(null, false, userId, dto);
  }

  async create(
    parentId: string,
    isComment: boolean,
    userId: number,
    dto: CreateCommentDto | CreateTweetDto,
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

      return await this.tweetsRepository.save({
        ...dto,
        isComment,
        author: profile,
        parentRecord,
        parentAuthor: parentRecord.author,
      });
    }

    return await this.tweetsRepository.save({
      ...dto,
      isComment,
      author: { id: profile.id },
    });
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

  async updateTweet(id: string, userId: number, dto: UpdateTweetDto) {
    return await this.update(id, userId, false, dto);
  }

  async updateComment(id: string, userId: number, dto: UpdateTweetDto) {
    return await this.update(id, userId, true, dto);
  }

  async update(
    id: string,
    userId: number,
    isComment: boolean,
    dto: UpdateTweetDto | UpdateCommentDto,
  ): Promise<Tweet> {
    const tweet = await this.findById(id);
    const profile = await this.profilesService.findByUserId(userId);

    if (!tweet) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    } else if (!profile) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    } else if (tweet.authorId !== profile.id) {
      throw new AccessDeniedError();
    } else if (tweet.isComment !== isComment) {
      //bad request???
      //типа когда мы пытаемся отредактировать коммент с помощью роута (и dto) для твита, или наоборот
      // по идее в будущем у createTweetDto будет поле private ("только для подписчиков"), а у CreateCommentDto - нет
    }

    const updated = await this.tweetsRepository.save({
      ...tweet,
      ...dto,
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

    return await this.tweetsRepository.delete({ id });
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
