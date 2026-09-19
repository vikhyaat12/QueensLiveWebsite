import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import type { Role, User } from "./commerce/types";
const scrypt=promisify(scryptCallback);
export function authSecret(){const value=process.env.AUTH_SECRET;if(process.env.NODE_ENV==="production"&&!value)throw new Error("AUTH_SECRET must be configured in production.");return value||"queens-care-local-development-secret-change-before-deployment";}
const encode=(value:object)=>Buffer.from(JSON.stringify(value)).toString("base64url");
export async function hashPassword(password:string){const salt=randomBytes(16).toString("hex"),derived=await scrypt(password,salt,64) as Buffer;return `scrypt$${salt}$${derived.toString("hex")}`;}
export async function verifyPassword(password:string,stored:string){const [,salt,hash]=stored.split("$");if(!salt||!hash)return false;const derived=await scrypt(password,salt,64) as Buffer;const expected=Buffer.from(hash,"hex");return expected.length===derived.length&&timingSafeEqual(expected,derived);}
export type SessionPayload = {
  sub: string;
  role: Role;
  name: string;
  email: string;
  tv?: number;
  exp: number;
};

export const signSession = (user: User, rememberMe = true) => {
  const durationMs = rememberMe ? 30 * 86400000 : 7 * 86400000;
  const data = encode({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    tv: user.tokenVersion || 1,
    exp: Date.now() + durationMs,
  });
  return `${data}.${createHmac("sha256", authSecret()).update(data).digest("base64url")}`;
};

export const verifySession = (token?: string): SessionPayload | null => {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = createHmac("sha256", authSecret()).update(data).digest("base64url");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
};

export const currentSession = async () => verifySession((await cookies()).get("qc_session")?.value);
