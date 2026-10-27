import { Hono } from "hono";
import type { AppEnv } from "../types/bindings";
import { getIssuerUrl } from "../utils/jwt";

export const wellKnownRoutes = new Hono<AppEnv>();

/**
 * OpenID Connect Discovery Document (RFC 8414 / OIDC Core)
 */
wellKnownRoutes.get("/openid-configuration", (c) => {
  const issuer = getIssuerUrl(c.env);

  const discoveryDoc = {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256", "HS256"],
    token_endpoint_auth_methods_supported: [
      "client_secret_post",
      "client_secret_basic",
      "none",
    ],
    claims_supported: ["sub", "iss", "aud", "exp", "email", "name", "avatar"],
    code_challenge_methods_supported: ["S256", "plain"],
    grant_types_supported: ["authorization_code"],
  };

  c.header("Cache-Control", "public, max-age=3600");
  return c.json(discoveryDoc, 200);
});
