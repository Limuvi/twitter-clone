import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseFilters,
  ForbiddenException,
  ConflictException,
  Put,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() dto: CreateProfileDto,
    @CurrentUser('id') userId: number,
  ) {
    const profile = await this.profileService.create(userId, dto);

    if (!profile) {
      throw new ConflictException('Username or profile are already exist');
    }

    return;
  }

  @Get()
  async findAll() {
    await this.profileService.findByUserId(29);
    return await this.profileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profileService.findById(id);
  }

  @UseGuards(AuthGuard)
  @Put('')
  async update(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ) {
    const { username } = dto;
    const profile = await this.profileService.findByUsername(username);

    if (profile && profile.userId !== userId) {
      throw new ConflictException('Username is already in use');
    }

    return await this.profileService.updateByUserId(userId, dto);
  }
}
