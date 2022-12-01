import { CustomError } from './custom-error.error';
import { ERROR_MESSAGES } from './error.messages';

export class InvalidRefreshSessionError extends CustomError {
  constructor(message = ERROR_MESSAGES.INVALID_REFRESH_SESSION) {
    super(message);
  }
}
