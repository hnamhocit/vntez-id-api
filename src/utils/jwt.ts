import { SignJWT, jwtVerify, importPKCS8, importSPKI, type KeyLike } from "jose";
import type { Bindings } from "../types/bindings";
import type { AccessTokenClaims } from "../types/oauth";

/**
 * Lấy Issuer URL chuẩn từ bindings
 */
export function getIssuerUrl(env: Bindings): string {
  if (env.NEXT_PUBLIC_SITE_URL) {
    return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  return "https://vntez-id.vercel.app";
}

/**
 * Ký Access Token JWT (HS256 hoặc RS256) chuẩn Web Crypto
 */
export async function signAccessToken(
  env: Bindings,
  params: {
    userId: string;
    clientId: string;
    email?: string;
    name?: string;
    avatar?: string | null;
    expiresInSeconds?: number;
  },
): Promise<{ accessToken: string; expiresIn: number }> {
  const expiresIn = params.expiresInSeconds ?? 3600;
  const issuer = getIssuerUrl(env);

  let key: Uint8Array | KeyLike;
  let algorithm = "HS256";

  if (env.VNTEZ_JWT_PRIVATE_KEY && env.VNTEZ_JWT_PRIVATE_KEY.includes("PRIVATE KEY")) {
    key = await importPKCS8(env.VNTEZ_JWT_PRIVATE_KEY, "RS256");
    algorithm = "RS256";
  } else {
    key = new TextEncoder().encode(
      env.VNTEZ_JWT_SECRET || "vntez_identity_jwt_secret_signing_key_2026_super_secure_auth",
    );
  }

  const jwt = await new SignJWT({
    email: params.email,
    name: params.name,
    avatar: params.avatar,
  })
    .setProtectedHeader({ alg: algorithm, typ: "JWT" })
    .setIssuedAt()
    .setIssuer(issuer)
    .setSubject(params.userId)
    .setAudience(params.clientId)
    .setExpirationTime(`${expiresIn}s`)
    .sign(key);

  return { accessToken: jwt, expiresIn };
}

/**
 * Xác thực Access Token JWT
 */
export async function verifyAccessToken(
  env: Bindings,
  token: string,
): Promise<AccessTokenClaims> {
  const issuer = getIssuerUrl(env);

  let key: Uint8Array | KeyLike;
  let algorithms: string[] = ["HS256"];

  if (env.VNTEZ_JWT_PUBLIC_KEY && env.VNTEZ_JWT_PUBLIC_KEY.includes("PUBLIC KEY")) {
    key = await importSPKI(env.VNTEZ_JWT_PUBLIC_KEY, "RS256");
    algorithms = ["RS256"];
  } else if (env.VNTEZ_JWT_PRIVATE_KEY && env.VNTEZ_JWT_PRIVATE_KEY.includes("PRIVATE KEY")) {
    key = await importPKCS8(env.VNTEZ_JWT_PRIVATE_KEY, "RS256");
    algorithms = ["RS256"];
  } else {
    key = new TextEncoder().encode(
      env.VNTEZ_JWT_SECRET || "vntez_identity_jwt_secret_signing_key_2026_super_secure_auth",
    );
  }

  const { payload } = await jwtVerify(token, key, {
    issuer,
    algorithms,
  });

  return {
    sub: payload.sub as string,
    aud: (Array.isArray(payload.aud) ? payload.aud[0] : payload.aud) as string,
    iss: payload.iss as string,
    iat: payload.iat as number,
    exp: payload.exp as number,
    email: payload.email as string | undefined,
    name: payload.name as string | undefined,
    avatar: payload.avatar as string | null | undefined,
  };
}
