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

  async create(userId: number, dto: CreateProfileDto) {
    const { username } = dto;

    let profile = await this.findByUserId(userId);

    if (profile) {
      throw new AlreadyExistsError(ERROR_MESSAGES.PROFILE_IS_EXISTS);
    }

    profile = await this.findByUsername(username);

    if (profile) {
      throw new AlreadyExistsError(ERROR_MESSAGES.USERNAME_IS_EXISTS);
    }

    return await this.profilesRepository.save({ ...dto, userId });
  }

  findAll() {
    return this.profilesRepository.find();
  }

  findById(id: string) {
    return this.profilesRepository.findOneBy({ id });
  }

  findByUsername(username: string) {
    return this.profilesRepository.findOne({ where: { username } });
  }

  findByUserId(userId: number) {
    return this.profilesRepository.findOneBy({ userId });
  }

  async updateByUserId(userId: number, dto: UpdateProfileDto) {
    const { username } = dto;
    const profile = await this.findByUsername(username);

    if (profile && profile.userId !== userId) {
      throw new AlreadyExistsError(ERROR_MESSAGES.USERNAME_IS_EXISTS);
    }

    return await this.profilesRepository.upsert({ ...dto, userId: userId }, [
      'userId',
    ]);
  }
}
