import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/bindings";

/**
 * CORS Middleware: Cho phép Frontend Next.js, Mobile scheme và các Client gọi API
 */
export const customCors = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const rawOrigins = c.env.ALLOWED_ORIGINS || "https://vntez-id.vercel.app,http://localhost:3000";
    const allowedList = rawOrigins.split(",").map((o) => o.trim());

    // Middleware CORS của Hono
    const corsMiddleware = cors({
      origin: (origin) => {
        // Cho phép server-to-server (curl, postman, backend không có Origin header)
        if (!origin) return "*";

        // Cho phép OAuth discovery & token endpoint được gọi từ bất kỳ client SPA nào
        const path = c.req.path;
        if (
          path.startsWith("/.well-known") ||
          path.startsWith("/oauth/token") ||
          path.startsWith("/oauth/userinfo")
        ) {
          return origin;
        }

        // Cho phép các domain trong danh sách và mobile app schemes
        if (
          allowedList.includes(origin) ||
          origin.startsWith("vntezid://") ||
          origin.startsWith("exp://")
        ) {
          return origin;
        }

        return allowedList[0] || "https://vntez-id.vercel.app";
      },
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposeHeaders: ["Content-Length", "X-Request-Id"],
      maxAge: 86400,
      credentials: true,
    });

    return corsMiddleware(c, next);
  };
};
