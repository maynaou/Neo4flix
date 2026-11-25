export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
export interface AuthSession extends AuthTokens {
  subject: string;
  displayName: string;
  expiresAt: number;
}
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}
