import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { profile } from 'console';
import { ILike, Repository } from 'typeorm';
import {
  AlreadyExistsError,
  ERROR_MESSAGES,
  NotFoundError,
} from '../common/errors';
import { IPaginationOptions, ISortingOptions } from '../common/types';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Following } from './entities/following.entity';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(Following)
    private followersRepository: Repository<Following>,
  ) {}

  async create(userId: number, dto: CreateProfileDto): Promise<Profile> {
    const { username } = dto;

    const userProfile = await this.findByUserId(userId);
    const usernameProfile = await this.findByUsername(username);

    if (userProfile) {
      throw new AlreadyExistsError(ERROR_MESSAGES.PROFILE_IS_EXISTS);
    } else if (usernameProfile) {
      throw new AlreadyExistsError(ERROR_MESSAGES.USERNAME_IS_EXISTS);
    }

    return await this.profilesRepository.save({ ...dto, userId });
  }

  async addFollower(profileId: string, followingId: string): Promise<void> {
    const following = await this.findById(followingId);

    if (!profileId || !following) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    await this.followersRepository.save({
      followerId: profileId,
      following,
    });
  }

  async isFollowers(firstId: string, secondId: string): Promise<boolean> {
    if (!firstId || !secondId) {
      return false;
    } else if (firstId === secondId) {
      return true;
    }

    const followers = await this.followersRepository.find({
      where: [
        {
          followerId: firstId,
          followingId: secondId,
        },
        {
          followerId: secondId,
          followingId: firstId,
        },
      ],
    });

    return followers.length > 1;
  }

  async isFollower(followerId: string, followingId: string): Promise<boolean> {
    if (!followerId || !followingId) {
      return false;
    } else if (followerId === followingId) {
      return true;
    }

    const follower = await this.followersRepository.findOne({
      where: { followerId, followingId },
    });

    return !!follower;
  }

  async findAll(
    username: string,
    paginationOptions?: IPaginationOptions,
    sortingOptions?: ISortingOptions,
  ): Promise<Profile[]> {
    const { sortBy = 'numberOfFollowers', orderBy = 'DESC' } = sortingOptions;
    const { page = 1, limit = 10 } = paginationOptions;

    const sortByField =
      sortBy === 'numberOfFollowers' ? `"${sortBy}"` : `profile.${sortBy}`;

    const profiles = await this.profilesRepository
      .createQueryBuilder('profile')
      .select()
      .addSelect('COUNT(followings.followerId)::int', 'numberOfFollowers')
      .addSelect('COUNT(followers.followingId)::int', 'numberOfFollowings')
      .leftJoin('profile.followings', 'followings')
      .leftJoin('profile.followers', 'followers')
      .where(username ? { username: ILike(`%${username}%`) } : {})
      .groupBy('profile.id')
      .orderBy({ [sortByField]: orderBy })
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return profiles;
  }

  async findFollowersById(id: string): Promise<Profile[]> {
    if (!id) {
      return [];
    }

    const followers = await this.profilesRepository
      .createQueryBuilder('profile')
      .innerJoin(
        'profile.followers',
        'follower',
        'follower.followingId = :id',
        {
          id,
        },
      )
      .getMany();

    return followers;
  }

  async findFollowingsById(id: string): Promise<Profile[]> {
    if (!id) {
      return [];
    }

    const following = await this.profilesRepository
      .createQueryBuilder('profile')
      .innerJoin(
        'profile.followings',
        'following',
        'following.followerId = :id',
        {
          id,
        },
      )
      .getMany();

    return following;
  }

  // async findFollowersByProfile(profile: Profile): Promise<Profile[]> {
  //   if (!profile) {
  //     return [];
  //   }

  //   const followers = await this.profilesRepository
  //     .createQueryBuilder('profile')
  //     .innerJoin(
  //       'profile.followers',
  //       'follower',
  //       'follower.followingId = :id',
  //       {
  //         id: profile.id,
  //       },
  //     )
  //     .getMany();

  //   return followers;
  // }

  // async findFollowingsByProfile(profile: Profile): Promise<Profile[]> {
  //   if (!profile) {
  //     return [];
  //   }

  //   const following = await this.profilesRepository
  //     .createQueryBuilder('profile')
  //     .innerJoin(
  //       'profile.followings',
  //       'following',
  //       'following.followerId = :id',
  //       {
  //         id: profile.id,
  //       },
  //     )
  //     .getMany();

  //   return following;
  // }

  findById(id: string): Promise<Profile> {
    return this.profilesRepository.findOneBy({ id });
  }

  findByUsername(username: string): Promise<Profile> {
    return this.profilesRepository.findOne({ where: { username } });
  }

  findByUserId(userId: number): Promise<Profile> {
    return this.profilesRepository.findOneBy({ userId });
  }

  async updateByUserId(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<Profile> {
    const { username } = dto;
    const profile = await this.findByUsername(username);

    if (profile && profile.userId !== userId) {
      throw new AlreadyExistsError(ERROR_MESSAGES.USERNAME_IS_EXISTS);
    }

    const upserted = await this.profilesRepository
      .createQueryBuilder()
      .insert()
      .into(Profile)
      .values({ ...dto, userId: userId })
      .orUpdate(Object.keys(dto), ['userId'])
      .returning('*')
      .execute();

    return upserted.raw;
  }

  async deleteFollower(profileId: string, followingId: string): Promise<void> {
    const following = await this.findById(followingId);

    if (!profileId || !following) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    await this.followersRepository.delete({
      followerId: profileId,
      followingId,
    });
  }
}
