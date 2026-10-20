// The SuperAdmin's own profile (GET/PUT /superadmin/me).
export interface MySuperAdminProfile {
  id: string;
  name: string;
  email: string;
  username: string;
}

export interface UpdateMySuperAdminProfileRequest {
  name: string;
  email: string;
}

export interface ChangeMySuperAdminPasswordRequest {
  currentPassword: string;
  newPassword: string;
}
