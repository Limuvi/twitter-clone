import { PrivacyInfoData } from '../../common/types';

export type Session = {
  userId: number;
  token: string;
  expirationTime: number;
} & PrivacyInfoData;
