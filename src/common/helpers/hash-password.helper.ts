import { createHmac } from 'crypto';

export const hashPassword = (password, key): string => {
  return createHmac('sha256', key).update(password).digest('hex');
};
