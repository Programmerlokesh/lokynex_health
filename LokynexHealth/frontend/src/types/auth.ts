export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  name: string;
  role: string;
  expiresAt: string;
}

// Response of the single sign-in endpoint (POST /Auth/sign-in).
// The SERVER decides which kind of account signed in, so the browser never
// has to "try lab first, then SuperAdmin".
export interface UnifiedLoginResponse {
  accountType: "Lab" | "SuperAdmin";
  token: string;
  userId: string;
  name: string;
  role: string;
  expiresAt: string;
}
