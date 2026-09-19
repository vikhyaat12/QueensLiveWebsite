import { json, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = safeText(body.token, 128);
  const password = safeText(body.password, 128);
  const confirmPassword = safeText(body.confirmPassword, 128);

  if (!token) return json({ error: "Reset token is required." }, 422);
  if (!password || password.length < 8) return json({ error: "Password must be at least 8 characters long." }, 422);
  if (confirmPassword && password !== confirmPassword) {
    return json({ error: "Passwords do not match." }, 422);
  }

  const record = await store.passwordReset.verifyToken(token);
  if (!record) {
    return json({ error: "Invalid or expired reset token." }, 400);
  }

  const user = await store.users.byId(record.userId);
  if (!user) {
    return json({ error: "Account not found." }, 404);
  }

  const nextTokenVersion = (user.tokenVersion || 1) + 1;
  const newHash = await hashPassword(password);

  await store.users.update(user.id, {
    passwordHash: newHash,
    tokenVersion: nextTokenVersion, // Invalidates all prior sessions across devices
  });

  await store.passwordReset.consumeToken(token);

  return json({ ok: true, message: "Password has been reset successfully. Please sign in with your new password." });
}

