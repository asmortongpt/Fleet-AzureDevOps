import { NotFoundError } from '../errors/NotFoundError';
import { UserRepository } from '../repositories/UserRepository';

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async getUserDetails(id: number, tenantId: number) {
    const user = await this.userRepository.findById(id, tenantId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}