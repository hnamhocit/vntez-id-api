import { Hono } from "hono";
import type { AppEnv } from "./types/bindings";
import { customCors } from "./middlewares/cors";
import { requestLogger } from "./middlewares/logger";
import { errorHandler, notFoundHandler } from "./middlewares/error";

// Import Route Handlers
import { wellKnownRoutes } from "./routes/well-known.route";
import { oauthRoutes } from "./routes/oauth.route";
import { clientsRoutes } from "./routes/clients.route";

const app = new Hono<AppEnv>();

// 1. Middlewares toàn cục
app.use("*", requestLogger());
app.use("*", customCors());

// 2. Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    environment: c.env.ENVIRONMENT || "production",
    timestamp: new Date().toISOString(),
  });
});

// 3. Gắn các Route Handlers
const routes = app
  .route("/.well-known", wellKnownRoutes)
  .route("/oauth", oauthRoutes)
  .route("/api/clients", clientsRoutes);

// 4. Xử lý lỗi & 404 tập trung
app.onError(errorHandler);
app.notFound(notFoundHandler);

// 5. Export App cho Cloudflare Workers Fetch Handler
export default app;

// 6. Export Type cho Hono RPC Client (Next.js Frontend có thể import hc<AppType>)
export type AppType = typeof routes;
