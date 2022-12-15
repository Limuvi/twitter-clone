import { IPrivacyInfo } from '../../common/types';

export type Session = {
  userId: number;
  token: string;
  expirationTime: number;
} & IPrivacyInfo;
