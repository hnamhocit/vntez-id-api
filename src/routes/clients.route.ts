import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AppEnv } from "../types/bindings";
import { CreateClientSchema } from "../schemas/oauth.schema";
import { ClientService } from "../services/client.service";

export const clientsRoutes = new Hono<AppEnv>();

/**
 * GET /api/clients: Danh sách các client đã đăng ký
 */
clientsRoutes.get("/", async (c) => {
  const clients = await ClientService.listClients(c.env);
  return c.json({
    success: true,
    data: clients,
  });
});

/**
 * POST /api/clients: Đăng ký OAuth Client mới
 */
clientsRoutes.post(
  "/",
  zValidator("json", CreateClientSchema),
  async (c) => {
    const validatedData = c.req.valid("json");
    const result = await ClientService.createClient(c.env, validatedData);

    return c.json(
      {
        success: true,
        data: result.client,
        generatedSecret: result.generatedSecret,
      },
      201,
    );
  },
);

/**
 * DELETE /api/clients/:id: Xóa client
 */
clientsRoutes.delete("/:id", async (c) => {
  const clientId = c.req.param("id");
  await ClientService.deleteClient(c.env, clientId);

  return c.json({
    success: true,
    message: `Đã xóa client ${clientId}`,
  });
});
