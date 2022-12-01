import { CustomError } from './custom-error.error';
import { ERROR_MESSAGES } from './error.messages';

export class AlreadyExistsError extends CustomError {
  constructor(message = ERROR_MESSAGES.ALREADY_EXISTS) {
    super(message);
  }
}
