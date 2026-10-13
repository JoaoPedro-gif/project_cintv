import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET precisa ter 32+ caracteres"),
  TWO_FACTOR_ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i, "Use 64 caracteres hexadecimais (32 bytes)"),
  REQUIRE_ADMIN_APPROVAL: z.enum(["true", "false"]).default("true").transform((v) => v === "true"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Configuração inválida (.env):", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
