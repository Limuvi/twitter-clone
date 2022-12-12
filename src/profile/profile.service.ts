import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AlreadyExistsError,
  ERROR_MESSAGES,
  NotFoundError,
} from '../common/errors';
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

  async addFollower(userId: number, followingId: string): Promise<void> {
    const follower = await this.findByUserId(userId);
    const following = await this.findById(followingId);

    if (!follower || !following) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    await this.followersRepository.save({
      follower,
      following,
    });
  }

  async isFollowers(firstId: string, secondId: string): Promise<boolean> {
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

  findAll(): Promise<Profile[]> {
    return this.profilesRepository.find();
  }

  async findFollowersById(id: string): Promise<Profile[]> {
    const profile = await this.findById(id);

    if (!profile) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
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

  async findFollowingById(id: string): Promise<Profile[]> {
    const profile = await this.findById(id);

    if (!profile) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
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

  async deleteFollower(userId: number, followingId: string): Promise<void> {
    const follower = await this.findByUserId(userId);
    const following = await this.findById(followingId);

    if (!follower || !following) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    await this.followersRepository.delete({
      followerId: follower.id,
      followingId,
    });
  }
}
