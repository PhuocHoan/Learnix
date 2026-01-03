import { type User } from '../entities/user.entity';

export interface IUsersService {
  findOne(id: string): Promise<User | null>;
}
