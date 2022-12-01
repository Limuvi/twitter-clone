import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const user =
      (await this.findByUsername(username)) ||
      (await this.findByUserId(userId));

    if (!user) {
      return await this.profilesRepository.save({ ...dto, userId });
    }
    return null;
  }

  findAll() {
    return this.profilesRepository.find();
  }

  findById(id: string) {
    return this.profilesRepository.findBy({ id });
  }

  findByUsername(username: string) {
    return this.profilesRepository.findOne({ where: { username } });
  }

  findByUserId(userId: number) {
    return this.profilesRepository.findOneBy({ userId });
  }

  async updateByUserId(userId: number, dto: UpdateProfileDto) {
    return await this.profilesRepository.upsert({ ...dto, userId: userId }, [
      'userId',
    ]);
  }
}
