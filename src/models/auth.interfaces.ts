export interface LoginResponse {
  token: string;
  user: User;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface User {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
}
