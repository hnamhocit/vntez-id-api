import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/bindings";

/**
 * Logging Middleware đo đạc thời gian xử lý và gán X-Request-Id
 */
export const requestLogger = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const start = performance.now();
    const requestId = c.req.header("x-request-id") || crypto.randomUUID();

    c.set("requestId", requestId);
    c.set("startTime", start);
    c.header("X-Request-Id", requestId);

    await next();

    const duration = (performance.now() - start).toFixed(2);
    const status = c.res.status;
    const method = c.req.method;
    const path = c.req.path;

    console.log(`[${method}] ${path} -> ${status} (${duration}ms) [${requestId}]`);
  };
};
