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
}
