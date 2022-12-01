import { CustomError } from './custom-error.error';
import { ERROR_MESSAGES } from './error.messages';

export class NotFoundError extends CustomError {
  constructor(message = ERROR_MESSAGES.NOT_FOUND) {
    super(message);
  }
}
