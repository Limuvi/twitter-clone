import { PrivacyInfoData } from '../common/types';

export type CreateSessionData = {
  userId: number | string;
  token: string;
} & PrivacyInfoData;

export type Session = {
  userId: number | string;
  token: string;
  expirationTime: number;
} & PrivacyInfoData;
