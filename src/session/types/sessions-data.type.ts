import { IPrivacyInfo } from '../../common/types';

export type CreateSessionData = {
  userId: number;
  token: string;
} & IPrivacyInfo;
