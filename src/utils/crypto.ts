/**
 * Tiện ích mã hóa & băm dữ liệu chuẩn Web Crypto API (100% Edge Runtime compliant)
 * Không phụ thuộc Node.js 'crypto' module hay binary native.
 */

/**
 * Băm chuỗi text thành chuỗi Hex SHA-256
 */
export async function sha256Hex(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Băm chuỗi text thành Base64URL không có padding (dành cho PKCE S256)
 */
export async function sha256Base64Url(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const bytes = new Uint8Array(hashBuffer);

  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Đối chiếu Client Secret (Hỗ trợ SHA-256 hash hoặc so khớp trực tiếp)
 */
export async function verifyClientSecret(
  providedSecret?: string,
  storedHash?: string | null,
): Promise<boolean> {
  if (!providedSecret || !storedHash) return false;

  const computedHash = await sha256Hex(providedSecret);
  if (computedHash === storedHash) return true;

  // Fallback so khớp plain nếu dev lưu secret chưa băm
  return providedSecret === storedHash;
}

/**
 * Kiểm tra tính hợp lệ của PKCE code_verifier đối chiếu với code_challenge
 */
export async function verifyPkce(
  verifier: string,
  challenge: string,
  method = "S256",
): Promise<boolean> {
  if (!verifier || !challenge) return false;

  if (method === "plain") {
    return verifier === challenge;
  }

  if (method === "S256") {
    const computed = await sha256Base64Url(verifier);
    return computed === challenge;
  }

  return false;
}

/**
 * Sinh chuỗi ngẫu nhiên an toàn (Cryptographically Secure)
 */
export function generateRandomString(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
