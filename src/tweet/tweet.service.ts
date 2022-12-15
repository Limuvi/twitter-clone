import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  In,
  IsNull,
  Not,
  Repository,
  TreeRepository,
} from 'typeorm';
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
import { IPaginationOptions, ISortingOptions } from '../common/types';
import { Bookmark } from './entities/tweet-bookmark.entity';

@Injectable()
export class TweetService {
  constructor(
    @InjectRepository(Tweet)
    private tweetsRepository: TreeRepository<Tweet>,
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Bookmark)
    private bookmarksRepository: Repository<Bookmark>,
    private profilesService: ProfileService,
    private filesService: FileService,
  ) {}

  createComment(
    parentId: string,
    profileId: string,
    dto: CreateCommentDto,
    images?: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    return this.create(parentId, true, profileId, dto, images);
  }

  createRetweet(
    parentId: string,
    profileId: string,
    dto: CreateTweetDto,
    images?: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    return this.create(parentId, false, profileId, dto, images);
  }

  createTweet(
    profileId: string,
    dto: CreateTweetDto,
    images?: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    return this.create(null, false, profileId, dto, images);
  }

  async create(
    parentId: string,
    isComment: boolean,
    profileId: string,
    dto: CreateCommentDto | CreateTweetDto,
    images?: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    if (!profileId) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    const imageNames = images?.length
      ? await this.filesService.create(images)
      : [];

    if (parentId) {
      const parentRecord = await this.tweetsRepository.findOne({
        where: { id: parentId },
      });

      if (!parentRecord) {
        throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
      }

      return await this.tweetsRepository.save({
        ...dto,
        isComment,
        isPrivate: parentRecord.isPrivate,
        // author: { id: profileId },
        authorId: profileId,
        parentRecord,
        parentAuthorId: parentRecord.authorId,
        imageNames,
      });
    }

    return await this.tweetsRepository.save({
      ...dto,
      isComment,
      author: { id: profileId },
      imageNames,
    });
  }

  async addLike(id: string, profileId: string): Promise<Tweet> {
    return await this.toggleLike(id, profileId, false);
  }

  async addBookmark(tweetId: string, profileId: string): Promise<void> {
    const tweet = await this.findById(tweetId, profileId);

    if (!profileId) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    const bookmark = await this.bookmarksRepository.findOne({
      where: { tweetId, profileId: profileId },
    });

    if (!bookmark) {
      await this.bookmarksRepository.insert({
        tweet,
        profileId,
      });
    }
  }

  async findTweets(
    paginationOptions: IPaginationOptions,
    sortingOptions: ISortingOptions,
    profileId?: string,
    isOnlyMedia?: boolean,
    currentProfileId?: string,
  ): Promise<Tweet[]> {
    const { sortBy = 'createdAt', orderBy = 'DESC' } = sortingOptions;
    const { page = 1, limit = 10 } = paginationOptions;

    const privacyCondtions: object[] = [{ isPrivate: false }];
    let followings = [];

    if (currentProfileId) {
      followings = await this.profilesService.findFollowingsById(
        currentProfileId,
      );

      const followingIds = [
        ...followings.map(({ id }) => id),
        currentProfileId,
      ];

      privacyCondtions.push({
        isPrivate: true,
        author: { id: In(followingIds) },
      });
    }

    return await this.tweetsRepository
      .createQueryBuilder('tweet')
      .leftJoinAndSelect('tweet.author', 'profile')
      .leftJoinAndSelect('tweet.parentRecord', 'parentRecord')
      .leftJoinAndSelect('tweet.parentAuthor', 'parentAuthor')
      .where({
        isComment: false,
        author: profileId ? { id: profileId } : {},
      })
      .andWhere(isOnlyMedia ? { imageNames: Not([]) } : {})
      .andWhere(privacyCondtions)
      .orderBy({ ['tweet.' + sortBy]: orderBy })
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async findFollowingsTweets(
    paginationOptions: IPaginationOptions,
    sortingOptions: ISortingOptions,
    profileId: string,
    isOnlyMedia?: boolean,
  ): Promise<Tweet[]> {
    const { sortBy = 'createdAt', orderBy = 'DESC' } = sortingOptions;
    const { page = 1, limit = 10 } = paginationOptions;

    if (!profileId) {
      return this.findTweets(paginationOptions, sortingOptions);
    }

    return await this.tweetsRepository
      .createQueryBuilder('tweet')
      .leftJoinAndSelect('tweet.author', 'profile')
      .leftJoinAndSelect('tweet.parentRecord', 'parentRecord')
      .leftJoinAndSelect('tweet.parentAuthor', 'parentAuthor')
      .innerJoin(
        'profile.followings',
        'followings',
        'followings.followerId = :followerId',
        {
          followerId: profileId,
        },
      )
      .where({ isComment: false })
      .andWhere(isOnlyMedia ? { imageNames: Not([]) } : {})
      .orderBy({ ['tweet.' + sortBy]: orderBy })
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  async findBookmarks(profileId: string): Promise<Tweet[]> {
    if (!profileId) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    return await this.tweetsRepository
      .createQueryBuilder('tweet')
      .innerJoin(
        'tweet.bookmarks',
        'bookmark',
        'bookmark.profileId = :profileId',
        { profileId },
      )
      .getMany();
  }

  async findById(
    id: string,
    profileId: string,
    relations: {
      author?: boolean;
      parentRecord?: boolean;
      parentAuthor?: boolean;
    } = {
      author: true,
      parentRecord: true,
      parentAuthor: true,
    },
  ): Promise<Tweet> {
    const tweet = await this.tweetsRepository.findOne({
      where: { id },
      relations,
    });

    if (!tweet) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    } else if (tweet.isPrivate) {
      const isFollower = await this.profilesService.isFollower(
        profileId,
        tweet.authorId,
      );

      if (!isFollower) {
        throw new AccessDeniedError(ERROR_MESSAGES.FOLLOWERS_ONLY_TWEET);
      }
    }
    return tweet;
  }

  async findDescendantsTreeById(
    id: string,
    isComment: boolean,
    sortingOptions: ISortingOptions,
    profileId: string,
  ): Promise<any> {
    const { sortBy = 'createdAt', orderBy = 'DESC' } = sortingOptions;
    const tweet = await this.findById(id, profileId, {
      author: false,
      parentAuthor: false,
      parentRecord: false,
    });

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
      .orderBy(
        `(CASE WHEN tweet.parentRecordId = '${id}' THEN tweet.${sortBy} END)`,
        orderBy,
      )
      .addOrderBy('tweet.createdAt', 'ASC')
      .getMany();

    const tweetsTree = this.mapToTree(tweets);

    return tweetsTree;
  }

  async updateTweet(
    id: string,
    profileId: string,
    dto: UpdateTweetDto,
    images: Array<Express.Multer.File>,
  ) {
    const { isPrivate } = dto;
    return await this.update(id, profileId, false, isPrivate, dto, images);
  }

  async updateComment(
    id: string,
    profileId: string,
    dto: UpdateCommentDto,
    images: Array<Express.Multer.File>,
  ) {
    return await this.update(id, profileId, true, null, dto, images);
  }

  async update(
    id: string,
    profileId: string,
    isComment: boolean,
    isPrivateRecord: boolean,
    dto: UpdateTweetDto | UpdateCommentDto,
    images: Array<Express.Multer.File>,
  ): Promise<Tweet> {
    const tweet = await this.tweetsRepository.findOne({
      where: { id },
      relations: { parentRecord: true },
    });

    if (!tweet || tweet.isComment !== isComment) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    } else if (!profileId) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    } else if (tweet.authorId !== profileId) {
      throw new AccessDeniedError();
    }

    const imageNames = images
      ? await this.filesService.replace(images, tweet.imageNames)
      : tweet.imageNames;
    const isPrivate = tweet.parentRecord?.isPrivate || isPrivateRecord;

    if (isPrivate !== tweet.isPrivate) {
      //if privacy changed, update all descendants isPrivate field
      await this.tweetsRepository
        .createDescendantsQueryBuilder('tweet', 'tweetClosure', tweet)
        .update({ isPrivate })
        .andWhere({ id: Not(id) })
        .execute();

      if (isPrivate) {
        const followers = await this.profilesService.findFollowersById(
          profileId,
        );
        await this.bookmarksRepository.delete({
          profileId: Not(In(followers)),
          tweetId: tweet.id,
        });
      }
    }

    const updated = await this.tweetsRepository.save({
      ...tweet,
      ...dto,
      imageNames,
      isPrivate,
    });

    delete updated.parentRecord;

    return updated;
  }

  async delete(id: string, profileId: string): Promise<DeleteResult> {
    const tweet = await this.tweetsRepository.findOne({
      where: { id },
    });

    if (!tweet) {
      throw new NotFoundError(ERROR_MESSAGES.TWEET_NOT_FOUND);
    } else if (!profileId) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    } else if (tweet.authorId !== profileId) {
      throw new AccessDeniedError();
    }
    const { imageNames } = tweet;

    if (imageNames.length) {
      await this.filesService.delete(imageNames);
    }

    return await this.tweetsRepository.delete({ id });
  }

  async deleteLike(id: string, profileId: string): Promise<Tweet> {
    return await this.toggleLike(id, profileId, true);
  }

  async deleteBookmark(tweetId: string, profileId: string): Promise<void> {
    if (!profileId) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    const bookmark = await this.bookmarksRepository.findOne({
      where: { tweetId, profileId },
    });

    if (!bookmark) {
      throw new NotFoundError(ERROR_MESSAGES.BOOKMARK_NOT_FOUND);
    }

    await this.bookmarksRepository.delete({ tweetId, profileId: profileId });
  }

  protected async toggleLike(
    id: string,
    profileId: string,
    isDeleting: boolean,
  ) {
    const tweet = await this.findById(id, profileId, {
      author: false,
      parentAuthor: false,
      parentRecord: false,
    });

    if (!profileId) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    const { id: tweetId } = tweet;
    const like = await this.likesRepository
      .createQueryBuilder('like')
      .where('like.profile.id = :profileId', { profileId })
      .andWhere('like.tweetId = :tweetId', { tweetId })
      .getOne();

    if ((!like && !isDeleting) || (like && isDeleting)) {
      if (!isDeleting) {
        await this.likesRepository.save({
          tweet: { id: tweetId },
          profile: { id: profileId },
        });
      } else {
        await this.likesRepository.delete(like.id);
      }

      const count = isDeleting ? -1 : 1;

      const updated = await this.tweetsRepository
        .createQueryBuilder('tweet')
        .update(Tweet)
        .set({ likesNumber: () => `"likesNumber" + ${count}` })
        .where({ id: tweetId })
        .returning('*')
        .execute();

      return updated.raw;
    }

    return tweet;
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
