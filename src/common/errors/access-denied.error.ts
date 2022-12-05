import { CustomError } from './custom-error.error';
import { ERROR_MESSAGES } from './error.messages';

export class AccessDeniedError extends CustomError {
  constructor(message = ERROR_MESSAGES.ACCESS_DENIED) {
    super(message);
  }
}
