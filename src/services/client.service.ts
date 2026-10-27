import { HTTPException } from "hono/http-exception";
import type { Bindings } from "../types/bindings";
import type { CreateClientInput } from "../schemas/oauth.schema";
import type { OAuthClientRecord } from "../types/oauth";
import { getSupabaseAdmin } from "../utils/supabase";
import { generateRandomString, sha256Hex } from "../utils/crypto";

export class ClientService {
  /**
   * Lấy danh sách toàn bộ OAuth Clients đã đăng ký
   */
  static async listClients(env: Bindings): Promise<OAuthClientRecord[]> {
    const supabase = getSupabaseAdmin(env);
    const { data, error } = await supabase
      .from("oauth_clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new HTTPException(500, { message: `Lỗi truy vấn DB: ${error.message}` });
    }

    return (data || []) as OAuthClientRecord[];
  }

  /**
   * Tạo OAuth Client mới (kèm cơ chế tự động thích ứng nếu schema cache thiếu cột)
   */
  static async createClient(
    env: Bindings,
    input: CreateClientInput,
  ): Promise<{ client: OAuthClientRecord; generatedSecret: string | null }> {
    const supabase = getSupabaseAdmin(env);
    const clientId = `vntez_${generateRandomString(12)}`;

    let generatedSecret: string | null = null;
    let clientSecretHash: string | null = null;

    if (input.is_confidential) {
      generatedSecret = `vntez_sec_${generateRandomString(24)}`;
      clientSecretHash = await sha256Hex(generatedSecret);
    }

    const payload: Record<string, any> = {
      client_id: clientId,
      name: input.name,
      redirect_uris: input.redirect_uris,
    };

    if (clientSecretHash) payload.client_secret_hash = clientSecretHash;
    if (input.description) payload.description = input.description;
    if (input.logo_url) payload.logo_url = input.logo_url;

    const attemptPayload = { ...payload };

    // Tự động retry nếu PostgREST chưa kịp reload schema cache cho các cột mới
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from("oauth_clients")
        .insert([attemptPayload])
        .select()
        .single();

      if (!error && data) {
        return {
          client: data as OAuthClientRecord,
          generatedSecret,
        };
      }

      if (error) {
        const match = error.message.match(
          /Could not find the '([^']+)' column of 'oauth_clients'/i,
        );
        if (match && match[1] && attemptPayload[match[1]] !== undefined) {
          delete attemptPayload[match[1]];
          continue;
        }
        throw new HTTPException(400, { message: error.message });
      }
    }

    throw new HTTPException(500, { message: "Không thể khởi tạo OAuth Client" });
  }

  /**
   * Xóa OAuth Client
   */
  static async deleteClient(env: Bindings, clientId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin(env);
    const { error } = await supabase
      .from("oauth_clients")
      .delete()
      .eq("client_id", clientId);

    if (error) {
      throw new HTTPException(500, { message: `Lỗi khi xóa client: ${error.message}` });
    }

    return true;
  }
}
