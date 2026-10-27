export interface OAuthClientRecord {
  client_id: string;
  client_secret_hash: string | null;
  name: string;
  redirect_uris: string[];
  logo_url?: string | null;
  description?: string | null;
  is_internal?: boolean;
  created_at?: string;
}

export interface OAuthCodeRecord {
  code: string;
  client_id: string;
  user_id: string;
  code_challenge: string | null;
  code_challenge_method: string | null;
  redirect_uri: string;
  expires_at: string;
  used: boolean;
  created_at?: string;
}

export interface AccessTokenClaims {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  email?: string;
  name?: string;
  avatar?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}

export interface UserInfoResponse {
  sub: string;
  email?: string;
  email_verified: boolean;
  name: string;
  avatar: string | null;
  picture: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
}
