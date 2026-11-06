export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  nickname: string;
  email: string | null;
  role: UserRole;
  isSuspended: boolean;
}
