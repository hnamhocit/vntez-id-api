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

// 2. Trang chủ & Health Check
app.get("/", (c) => {
  const acceptHeader = c.req.header("accept") || "";
  const isHtml = acceptHeader.includes("text/html");

  if (!isHtml) {
    return c.json({
      name: "VNTEZ ID Service",
      version: "2.0.0",
      status: "online",
      environment: c.env.ENVIRONMENT || "production",
      issuer: c.env.NEXT_PUBLIC_SITE_URL || "https://id.hnamhocit.workers.dev",
      webUrl: c.env.NEXT_PUBLIC_WEB_URL || "https://vntez-id.vercel.app",
      endpoints: {
        health: "/health",
        openid_configuration: "/.well-known/openid-configuration",
        token: "/oauth/token",
        userinfo: "/oauth/userinfo",
        authorize: "/oauth/authorize",
        clients: "/api/clients",
      },
      timestamp: new Date().toISOString(),
    });
  }

  const webUrl = c.env.NEXT_PUBLIC_WEB_URL || "https://vntez-id.vercel.app";
  const apiUrl = c.env.NEXT_PUBLIC_SITE_URL || "https://id.hnamhocit.workers.dev";

  const html = `<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VNTEZ ID — Cloudflare Worker API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #080c14;
      --card: #0d121f;
      --border: rgba(255, 255, 255, 0.1);
      --primary: #fb291a;
      --primary-hover: #e02012;
      --text: #f8fafc;
      --muted: #94a3b8;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 1.5rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      max-width: 580px;
      width: 100%;
      padding: 2.25rem;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(247, 114, 65, 0.12);
      color: var(--primary);
      border: 1px solid rgba(247, 114, 65, 0.25);
      margin-bottom: 1rem;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    h1 {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    h1 span.brand { color: var(--primary); }
    p.desc {
      color: var(--muted);
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .grid {
      display: grid;
      gap: 0.625rem;
      margin-bottom: 1.75rem;
    }
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 0.8125rem;
    }
    .item code {
      font-family: 'JetBrains Mono', monospace;
      color: #38bdf8;
      font-size: 0.75rem;
    }
    .tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 0.375rem;
      background: rgba(16, 185, 129, 0.15);
      color: var(--success);
    }
    .btn-group {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.625rem 1.25rem;
      border-radius: 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: var(--primary);
      color: #fff;
    }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-outline {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-outline:hover { background: rgba(255, 255, 255, 0.08); }
    footer {
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: var(--muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <div class="status-dot"></div>
      Cloudflare Workers • Active
    </div>
    <h1>VNTEZ <span class="brand">ID</span> API</h1>
    <p class="desc">
      Hạ tầng xác thực phân tán toàn cầu theo chuẩn OAuth 2.0 PKCE & OpenID Connect. Được tối ưu hóa cho tốc độ xử lý sub-millisecond trên Cloudflare Edge.
    </p>

    <div class="grid">
      <div class="item">
        <span>OpenID Discovery</span>
        <code>/.well-known/openid-configuration</code>
      </div>
      <div class="item">
        <span>OAuth Token (PKCE S256)</span>
        <code>POST /oauth/token</code>
      </div>
      <div class="item">
        <span>User Profile & Claims</span>
        <code>GET /oauth/userinfo</code>
      </div>
      <div class="item">
        <span>Health Status</span>
        <span class="tag">HTTP 200 OK</span>
      </div>
    </div>

    <div class="btn-group">
      <a href="${webUrl}" class="btn btn-primary" target="_blank">Mở VNTEZ ID Web Portal →</a>
      <a href="${apiUrl}/.well-known/openid-configuration" class="btn btn-outline" target="_blank">Xem Discovery Spec</a>
    </div>
  </div>
  <footer>
    © 2026 VNTEZ Cloud • Powered by Cloudflare Workers (id.hnamhocit.workers.dev)
  </footer>
</body>
</html>`;

  return c.html(html);
});

// 3. Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    worker: "id",
    domain: "id.hnamhocit.workers.dev",
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
