export interface SuperAdminLoginRequest {
  username: string;
  password: string;
}

export interface SuperAdminLoginResponse {
  token: string;
  superAdminId: string;
  name: string;
  expiresAt: string;
}
