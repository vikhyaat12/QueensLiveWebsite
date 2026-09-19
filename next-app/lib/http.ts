import { NextResponse } from "next/server";
import { currentSession } from "./auth";
import { store } from "./commerce/store";
import type { Role } from "./commerce/types";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

import { verifyCsrf } from "./csrf";

// Function overloads to support both existing callers and new callers passing a Request
export async function requireUser(roles?: Role[]): Promise<any>;
export async function requireUser(request: Request, roles?: Role[]): Promise<any>;
export async function requireUser(arg1?: Role[] | Request, arg2?: Role[]) {
  let request: Request | undefined;
  let roles: Role[] | undefined;

  if (arg1 && typeof (arg1 as Request).method === "string") {
    request = arg1 as Request;
    roles = arg2;
  } else {
    roles = arg1 as Role[] | undefined;
  }

  if (request) {
    const csrf = verifyCsrf(request);
    if (!csrf.valid) {
      return json({ error: csrf.error || 'CSRF validation failed' }, 403);
    }
  }

  const session = await currentSession();
  if (!session) return null;
  const user = await store.users.byId(session.sub);
  if (!user) return null;
  // Enforce account status server-side
  if (user.status === "disabled" || user.status === "deactivated" || user.isActive === false) {
    return null;
  }
  // Enforce session revocation via tokenVersion
  if (user.tokenVersion && session.tv && session.tv !== user.tokenVersion) {
    return null;
  }
  if (roles && !roles.includes(user.role)) return null;
  return user;
}

export const safeText = (value: unknown, max = 500) => (typeof value === "string" ? value.trim().slice(0, max) : "");
