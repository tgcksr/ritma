import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import type { UserDTO } from '@ritma/shared';
import { AppError } from '../../core/errors';
import { authRepository } from './auth.repository';

// Compared against when the e-mail is unknown, so response time doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', 10);

const toUserDTO = ({ id, email, name, role }: User): UserDTO => ({ id, email, name, role });

export const authService = {
  async login(email: string, password: string): Promise<UserDTO> {
    const user = await authRepository.findByEmail(email);
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    return toUserDTO(user);
  },

  async getUser(id: string): Promise<UserDTO> {
    const user = await authRepository.findById(id);
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Session user no longer exists');
    return toUserDTO(user);
  },

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  },
};
