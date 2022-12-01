import { CustomError } from './custom-error.error';
import { ERROR_MESSAGES } from './error.messages';

export class LoginError extends CustomError {
  constructor(message = ERROR_MESSAGES.CREDS_DO_NOT_MATCH) {
    super(message);
  }
}
