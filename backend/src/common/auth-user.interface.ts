import { Role } from './enums.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
