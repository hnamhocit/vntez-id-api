import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../types/bindings";
import { TokenRequestSchema } from "../schemas/oauth.schema";
import { OAuthService } from "../services/oauth.service";

export const oauthRoutes = new Hono<AppEnv>();

/**
 * GET /oauth/authorize: Chuyển hướng trình duyệt tới giao diện xác thực và chấp thuận
 */
oauthRoutes.get("/authorize", (c) => {
  const webUrl = c.env.NEXT_PUBLIC_WEB_URL || "https://vntez-id.vercel.app";
  const incomingUrl = new URL(c.req.url);
  const targetUrl = new URL("/oauth/authorize", webUrl);
  targetUrl.search = incomingUrl.search;
  return c.redirect(targetUrl.toString(), 302);
});

/**
 * POST /oauth/token: Trao đổi Authorization Code lấy Access Token (PKCE + Secret)
 * Hỗ trợ cả application/x-www-form-urlencoded (RFC chuẩn) và application/json
 */
oauthRoutes.post("/token", async (c) => {
  const contentType = c.req.header("content-type") || "";
  let rawBody: Record<string, any> = {};

  if (contentType.includes("application/x-www-form-urlencoded")) {
    rawBody = await c.req.parseBody();
  } else {
    rawBody = await c.req.json().catch(() => ({}));
  }

  // Validate bằng Zod schema
  const parseResult = TokenRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    const firstErr = parseResult.error.issues[0]?.message || "Tham số không hợp lệ";
    return c.json(
      {
        error: "invalid_request",
        error_description: firstErr,
      },
      400,
    );
  }

  try {
    const tokenResult = await OAuthService.exchangeToken(c.env, parseResult.data);

    c.header("Cache-Control", "no-store");
    c.header("Pragma", "no-cache");
    return c.json(tokenResult, 200);
  } catch (err: any) {
    if (err instanceof HTTPException) {
      return c.json(
        {
          error: "invalid_grant",
          error_description: err.message,
        },
        err.status,
      );
    }
    return c.json(
      {
        error: "server_error",
        error_description: err?.message || "Lỗi xử lý token",
      },
      500,
    );
  }
});

/**
 * GET/POST /oauth/userinfo: Lấy thông tin tài khoản người dùng qua Bearer Token
 */
const handleUserInfo = async (c: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        error: "unauthorized",
        error_description: "Thiếu Bearer access token trong Authorization header",
      },
      401,
    );
  }

  const token = authHeader.substring(7).trim();
  try {
    const userInfo = await OAuthService.getUserInfo(c.env, token);
    return c.json(userInfo, 200);
  } catch (err: any) {
    if (err instanceof HTTPException) {
      return c.json(
        {
          error: "invalid_token",
          error_description: err.message,
        },
        err.status,
      );
    }
    return c.json(
      {
        error: "server_error",
        error_description: err?.message || "Lỗi truy vấn userinfo",
      },
      500,
    );
  }
};

oauthRoutes.get("/userinfo", handleUserInfo);
oauthRoutes.post("/userinfo", handleUserInfo);
