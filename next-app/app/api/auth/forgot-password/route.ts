import { json, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { emailService } from "@/lib/email/email-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = safeText(body.email, 120).toLowerCase();
  if (!email) return json({ error: "Email required" }, 422);

  const user = await store.users.findEmail(email);
  // Always return identical message regardless of whether user exists
  if (!user || user.status === "disabled" || user.status === "deactivated" || user.isActive === false) {
    return json({ message: "If an account exists, a reset link has been sent." });
  }

  const token = await store.passwordReset.createToken(user.id, user.email);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const resetUrl = `${siteUrl}/auth/reset-password?token=${token}`;

  // Dispatch Transactional Email
  try {
    emailService.send({
      templateId: "auth_password_reset",
      recipientEmail: user.email,
      recipientName: user.name || "Customer",
      data: {
        customer_name: user.name || "Valued Customer",
        reset_url: resetUrl,
        expiry_minutes: 30,
      },
      idempotencyKey: `pw_reset_${token}`,
    }).catch((err) => console.error("Password reset email error:", err));
  } catch {}

  return json({
    message: "If an account exists, a reset link has been sent.",
    ...(process.env.NODE_ENV !== "production" || !process.env.DATABASE_URL ? { resetUrl, token } : {}),
  });
}

