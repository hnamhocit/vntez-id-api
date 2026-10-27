import { z } from "zod";

/**
 * Schema validate Request Body của POST /oauth/token
 */
export const TokenRequestSchema = z.object({
  grant_type: z.literal("authorization_code", {
    errorMap: () => ({ message: "grant_type phải là 'authorization_code'" }),
  }),
  code: z.string().min(1, "Thiếu authorization code"),
  client_id: z.string().min(1, "Thiếu client_id"),
  client_secret: z.string().optional(),
  code_verifier: z.string().optional(),
  redirect_uri: z.string().url("redirect_uri không hợp lệ"),
});

export type TokenRequestInput = z.infer<typeof TokenRequestSchema>;

/**
 * Schema validate Đăng ký OAuth Client mới
 */
export const CreateClientSchema = z.object({
  name: z.string().min(2, "Tên ứng dụng tối thiểu 2 ký tự").max(100),
  redirect_uris: z.array(z.string().url("Redirect URI không hợp lệ")).min(1, "Cần ít nhất 1 Redirect URI"),
  is_confidential: z.boolean().default(false),
  description: z.string().max(500).optional(),
  logo_url: z.string().url("Logo URL không hợp lệ").optional(),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
