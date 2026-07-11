import { UserRole } from '../../users/user.schema';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
