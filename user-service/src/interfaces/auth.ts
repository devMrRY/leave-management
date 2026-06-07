export interface CreateUserDTO {
  username: string;
  email: string;
  role: string;
  password: string;
  managerId?: string | null;
  name?: string;
}

export interface GetUserParams {
  email?: string;
  username?: string;
}

export interface UserLean {
  employeeId: string;
  username: string;
  email: string;
  role: string;
  password: string;
  managerId?: string | null;
  name?: string;
}

export default {};
