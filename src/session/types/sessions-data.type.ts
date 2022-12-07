import { PrivacyInfoData } from '../../common/types';

export type CreateSessionData = {
  userId: number;
  token: string;
} & PrivacyInfoData;
