import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
  ParseUUIDPipe,
  HttpCode,
  Delete,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { ERROR_MESSAGES, NotFoundError } from '../common/errors';
import { Profile } from './entities/profile.entity';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() dto: CreateProfileDto,
    @CurrentUser('id') userId: number,
  ): Promise<void> {
    await this.profileService.create(userId, dto);
    return;
  }

  @UseGuards(AuthGuard)
  @Post(':id/followers')
  async addFollower(
    @Param('id', new ParseUUIDPipe({ version: '4' })) followingId: string,
    @CurrentUser('id') userId: number,
  ): Promise<void> {
    await this.profileService.addFollower(userId, followingId);

    return;
  }

  @Get()
  async findAll(): Promise<Profile[]> {
    return await this.profileService.findAll();
  }

  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Profile> {
    const profile = await this.profileService.findById(id);

    if (!profile) {
      throw new NotFoundError(ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    return profile;
  }

  @Get(':id/followers')
  async findFollowers(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Profile[]> {
    return await this.profileService.findFollowersById(id);
  }

  @Get(':id/following')
  async findFollowingById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Profile[]> {
    return await this.profileService.findFollowingsById(id);
  }

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @Put('')
  async updateById(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ): Promise<void> {
    await this.profileService.updateByUserId(userId, dto);
    return;
  }

  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Delete(':id/followers')
  async deleteFollower(
    @Param('id', new ParseUUIDPipe({ version: '4' })) followingId: string,
    @CurrentUser('id') userId: number,
  ): Promise<void> {
    await this.profileService.deleteFollower(userId, followingId);
    return;
  }
}
