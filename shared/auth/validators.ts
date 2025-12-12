import { BadRequestError } from '@shared/core/errors';

const validatePassword = (password: string): void => {
  if (password.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    throw new BadRequestError('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new BadRequestError('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    throw new BadRequestError('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    throw new BadRequestError('Password must contain at least one special character');
  }
};

export { validatePassword };