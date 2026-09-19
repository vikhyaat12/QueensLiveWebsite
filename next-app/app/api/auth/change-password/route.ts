import { hashPassword, signSession, verifyPassword } from "@/lib/auth";
import { store } from "@/lib/commerce/store";
import type { AuthUser } from "@/lib/commerce/types";
import { json, requireUser, safeText } from "@/lib/http";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const currentPassword = safeText(body.currentPassword, 128);
  const newPassword = safeText(body.newPassword, 128);
  const confirmPassword = safeText(body.confirmPassword, 128);

  if (!currentPassword || !newPassword) {
    return json({ error: "Current password and new password are required." }, 422);
  }

  if (newPassword.length < 8) {
    return json({ error: "New password must be at least 8 characters long." }, 422);
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return json({ error: "New passwords do not match." }, 422);
  }

  const fullUser = (await store.users.byId(user.id)) as AuthUser | null;
  if (!fullUser) {
    return json({ error: "User not found." }, 404);
  }

  const isCurrentValid =
    fullUser.passwordHash === "local-dev-only"
      ? process.env.NODE_ENV !== "production" && currentPassword === "admin12345"
      : await verifyPassword(currentPassword, fullUser.passwordHash);

  if (!isCurrentValid) {
    return json({ error: "Current password is incorrect." }, 400);
  }

  const nextTokenVersion = (fullUser.tokenVersion || 1) + 1;
  const newHash = await hashPassword(newPassword);

  const updatedUser = await store.users.update(fullUser.id, {
    passwordHash: newHash,
    tokenVersion: nextTokenVersion,
  });

  const response = json({ ok: true, message: "Password has been updated successfully." });
  if (updatedUser) {
    // Re-issue current session with the updated tokenVersion so this device remains logged in
    response.cookies.set("qc_session", signSession(updatedUser, true), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 86400,
    });
  }

  return response;
}
