import { HTTPException } from "hono/http-exception";
import type { Bindings } from "../types/bindings";
import type { TokenRequestInput } from "../schemas/oauth.schema";
import type {
  OAuthClientRecord,
  OAuthCodeRecord,
  TokenResponse,
  UserInfoResponse,
} from "../types/oauth";
import { getSupabaseAdmin } from "../utils/supabase";
import { verifyClientSecret, verifyPkce } from "../utils/crypto";
import { signAccessToken, verifyAccessToken } from "../utils/jwt";

export class OAuthService {
  /**
   * Đổi Authorization Code lấy Access Token
   */
  static async exchangeToken(
    env: Bindings,
    input: TokenRequestInput,
  ): Promise<TokenResponse> {
    const supabase = getSupabaseAdmin(env);

    // 1. Kiểm tra Client ID
    const { data: client, error: clientErr } = await supabase
      .from("oauth_clients")
      .select("*")
      .eq("client_id", input.client_id)
      .maybeSingle<OAuthClientRecord>();

    if (clientErr || !client) {
      throw new HTTPException(401, {
        message: "Client không hợp lệ hoặc chưa đăng ký trong hệ thống",
      });
    }

    // 2. Nếu là Confidential Client, kiểm tra Client Secret
    if (client.client_secret_hash) {
      const isSecretValid = await verifyClientSecret(
        input.client_secret,
        client.client_secret_hash,
      );
      if (!isSecretValid) {
        throw new HTTPException(401, {
          message: "client_secret không chính xác hoặc thiếu",
        });
      }
    }

    // 3. Kiểm tra Authorization Code
    const { data: codeRecord, error: codeErr } = await supabase
      .from("oauth_codes")
      .select("*")
      .eq("code", input.code)
      .eq("client_id", input.client_id)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle<OAuthCodeRecord>();

    if (codeErr || !codeRecord || codeRecord.redirect_uri !== input.redirect_uri) {
      throw new HTTPException(400, {
        message: "Auth code không hợp lệ, đã hết hạn hoặc redirect_uri không khớp",
      });
    }

    // 4. Xác thực PKCE nếu client có đăng ký code_challenge
    if (codeRecord.code_challenge) {
      if (!input.code_verifier) {
        throw new HTTPException(400, {
          message: "Yêu cầu cung cấp code_verifier để xác thực PKCE",
        });
      }

      const isPkceValid = await verifyPkce(
        input.code_verifier,
        codeRecord.code_challenge,
        codeRecord.code_challenge_method || "S256",
      );

      if (!isPkceValid) {
        throw new HTTPException(400, {
          message: "code_verifier không khớp với code_challenge đã đăng ký",
        });
      }
    }

    // 5. Đánh dấu Auth Code đã sử dụng (chống Replay Attack)
    await supabase
      .from("oauth_codes")
      .update({ used: true })
      .eq("code", input.code);

    // 6. Cấp Access Token JWT
    const { accessToken, expiresIn } = await signAccessToken(env, {
      userId: codeRecord.user_id,
      clientId: input.client_id,
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
      scope: "openid profile email",
    };
  }

  /**
   * Truy vấn thông tin người dùng từ Bearer Token
   */
  static async getUserInfo(
    env: Bindings,
    token: string,
  ): Promise<UserInfoResponse> {
    const claims = await verifyAccessToken(env, token).catch(() => {
      throw new HTTPException(401, {
        message: "Access token đã hết hạn hoặc chữ ký không hợp lệ",
      });
    });

    const supabase = getSupabaseAdmin(env);

    // Query user profile từ Supabase Auth qua admin API
    try {
      const { data, error } = await supabase.auth.admin.getUserById(claims.sub);
      if (!error && data?.user) {
        const u = data.user;
        const meta = u.user_metadata || {};
        return {
          sub: u.id,
          email: u.email,
          email_verified: Boolean(u.email_confirmed_at),
          name: meta.full_name || meta.name || u.email?.split("@")[0] || "User",
          avatar: meta.avatar_url || meta.picture || null,
          picture: meta.avatar_url || meta.picture || null,
        };
      }
    } catch {
      // Fallback nếu không có service key admin
    }

    // Fallback thông tin trực tiếp từ claims của token
    return {
      sub: claims.sub,
      email: claims.email,
      email_verified: true,
      name: claims.name || "User",
      avatar: claims.avatar || null,
      picture: claims.avatar || null,
    };
  }
}
