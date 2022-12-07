import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlreadyExistsError, ERROR_MESSAGES } from '../common/errors';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
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

  findAll(): Promise<Profile[]> {
    return this.profilesRepository.find();
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
}
