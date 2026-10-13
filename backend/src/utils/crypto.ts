import crypto from "crypto";
import { env } from "../config/env";

const key = Buffer.from(env.TWO_FACTOR_ENCRYPTION_KEY, "hex");

// AES-256-GCM: formato "iv.tag.dados" em base64
export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decrypt(payload: string): string {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}

export const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");
