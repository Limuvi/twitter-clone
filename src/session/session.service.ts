import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Session } from './types/session.type';
import { StoreRepository } from '../store/store.repository';
import { SessionKey } from './types/session-key.type';
import { CreateSessionData } from './types/sessions-data.type';

@Injectable()
export class SessionService {
  private maxSessions: number;
  private TTL: number;

  constructor(
    private repository: StoreRepository<Session, SessionKey>,
    private configService: ConfigService,
  ) {
    this.maxSessions = configService.get('MAX_SESSIONS_COUNT');
    this.TTL = configService.get('REFRESH_TOKEN_EXPIRATION_TIME');
  }

  async findByUserIdAndSort(userId: number): Promise<Session[]> {
    const sessions = await this.repository.find({ userId, token: null });
    return sessions.sort((a, b) => {
      return a.expirationTime - b.expirationTime;
    });
  }

  async findByUserIdAndToken(userId: number, token: string): Promise<Session> {
    const session = await this.repository.findByKey({ userId, token });
    return session;
  }

  async create(sessionData: CreateSessionData): Promise<string> {
    const { userId, token } = sessionData;
    const sessions = await this.findByUserIdAndSort(userId);

    if (sessions.length >= this.maxSessions) {
      const [{ token }] = sessions;
      await this.repository.deleteByKey({ userId, token }); //delete the oldest session
    }

    const expirationTime = new Date().getTime() + this.TTL * 1000;
    const session = { ...sessionData, userId, token, expirationTime };
    const key = await this.repository.createWithTTL(
      { userId, token },
      session,
      this.TTL,
    );
    return key;
  }

  async replaceSession(
    sessionData: CreateSessionData,
    prevToken: string,
  ): Promise<string> {
    const { userId, ip, userAgent } = sessionData;
    const prev = await this.findByUserIdAndToken(userId, prevToken);

    if (prev && prev.ip === ip && prev.userAgent === userAgent) {
      const key = await this.create(sessionData);

      await this.deleteByUserIdAndToken(userId, prevToken);
      return key;
    }
    return null;
  }

  async deleteByUserIdAndToken(userId: number, token: string): Promise<number> {
    return await this.repository.deleteByKey({ userId, token });
  }

  async deleteByUserId(userId: number): Promise<number> {
    return await this.repository.deleteByPattern({ token: null, userId });
  }
}
