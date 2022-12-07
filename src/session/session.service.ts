import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CreateSessionData, Session } from './session.type';
import { SessionRepository } from './session.repository';

@Injectable()
export class SessionService {
  private maxSessions: number;
  private TTL: number;

  constructor(
    private sessionRepository: SessionRepository,
    private configService: ConfigService,
  ) {
    this.maxSessions = configService.get('MAX_SESSIONS_COUNT');
    this.TTL = configService.get('REFRESH_TOKEN_EXPIRATION_TIME');
  }

  async findByUserId(userId: number | string): Promise<Session[]> {
    const sessions = await this.sessionRepository.findByUserId(userId);
    return sessions;
  }

  async findByUserIdAndToken(
    userId: number | string,
    token: string,
  ): Promise<Session> {
    const session = await this.sessionRepository.findByUserIdAndToken(
      userId,
      token,
    );
    return session;
  }

  async create(sessionData: CreateSessionData): Promise<string> {
    const { userId } = sessionData;
    const sessions = await this.sessionRepository.findByUserId(userId);

    if (sessions.length >= this.maxSessions) {
      const [{ userId: id, token }] = sessions;
      await this.sessionRepository.delete(id, token); //delete the oldest session
    }

    const key = await this.sessionRepository.create(sessionData, this.TTL);
    return key;
  }

  async replaceSession(
    sessionData: CreateSessionData,
    prevToken: string,
  ): Promise<string> {
    const { userId, ip, userAgent } = sessionData;
    const prev = await this.sessionRepository.findByUserIdAndToken(
      userId,
      prevToken,
    );

    if (prev && prev.ip === ip && prev.userAgent === userAgent) {
      const key = await this.create(sessionData);

      await this.deleteByUserIdAndToken(userId, prevToken);
      return key;
    }
    return null;
  }

  async deleteByUserIdAndToken(
    userId: string | number,
    token: string,
  ): Promise<number> {
    return await this.sessionRepository.delete(userId, token);
  }

  async deleteByToken(token: string): Promise<number> {
    return await this.sessionRepository.deleteByToken(token);
  }

  async deleteByUserId(userId: string | number): Promise<number> {
    return await this.sessionRepository.deleteByUserId(userId);
  }
}
