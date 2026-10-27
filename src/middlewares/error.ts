import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { AppEnv } from "../types/bindings";

/**
 * Xử lý lỗi tập trung chuẩn format { success: false, message: string, code: string }
 */
export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get("requestId") || "unknown";

  // Lỗi HTTP Exception từ Hono
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        message: err.message,
        code: `HTTP_${err.status}`,
      },
      err.status,
    );
  }

  // Lỗi Zod Validation
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return c.json(
      {
        success: false,
        message: firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Dữ liệu không hợp lệ",
        code: "VALIDATION_ERROR",
      },
      400,
    );
  }

  // Lỗi không xác định (Internal Server Error)
  console.error(`[Unhandled Error] [${requestId}]:`, err);
  return c.json(
    {
      success: false,
      message: err.message || "Đã xảy ra lỗi máy chủ nội bộ",
      code: "INTERNAL_SERVER_ERROR",
    },
    500,
  );
};

export const notFoundHandler: NotFoundHandler<AppEnv> = (c) => {
  return c.json(
    {
      success: false,
      message: `Không tìm thấy tài nguyên: ${c.req.method} ${c.req.path}`,
      code: "NOT_FOUND",
    },
    404,
  );
};
