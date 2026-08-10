/**
 * Validation middleware
 * Validates request body against Zod schemas
 */

import type { Context, Next } from "hono";
import type { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors";

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const result = schema.safeParse(body);

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new ValidationError("Validation failed", details);
    }

    // Attach validated data to context
    c.set("validatedBody", result.data);
    await next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const query = Object.fromEntries(new URL(c.req.url).searchParams);
    const result = schema.safeParse(query);

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new ValidationError("Query validation failed", details);
    }

    c.set("validatedQuery", result.data);
    await next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const params = c.req.param();
    const result = schema.safeParse(params);

    if (!result.success) {
      const details = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new ValidationError("URL parameter validation failed", details);
    }

    c.set("validatedParams", result.data);
    await next();
  };
}
