import { hashPassword, signSession } from "@/lib/auth";
import { store } from "@/lib/commerce/store";
import { json, safeText } from "@/lib/http";
import { emailService } from "@/lib/email/email-service";

const PHONE_REGEX = /^[0-9+\-\s]{10,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = safeText(body?.name, 80);
  const email = safeText(body?.email, 120).toLowerCase();
  const phone = safeText(body?.phone || body?.mobile, 20);
  const password = safeText(body?.password, 128);
  const confirmPassword = safeText(body?.confirmPassword, 128);

  if (!name || name.trim().length < 2) {
    return json({ error: "Please enter your full name." }, 422);
  }

  const cleanedPhone = phone.replace(/[\s\-]/g, "");
  if (!phone || !PHONE_REGEX.test(phone) || cleanedPhone.replace(/\+/g, "").length < 10) {
    return json({ error: "Please enter a valid 10-digit mobile number." }, 422);
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return json({ error: "Please enter a valid email address." }, 422);
  }

  if (!password || password.length < 8) {
    return json({ error: "Password must be at least 8 characters long." }, 422);
  }

  if (confirmPassword && password !== confirmPassword) {
    return json({ error: "Passwords do not match." }, 422);
  }

  if (await store.users.findEmail(email)) {
    return json({ error: "An account already exists for this email." }, 409);
  }

  const hasDb = Boolean(process.env.DATABASE_URL);
  const anyUsersExist = await store.users.hasAny();
  const isFirstDevUser = !hasDb && !anyUsersExist;

  const user = await store.users.create({
    name,
    email,
    phone,
    role: isFirstDevUser ? "admin" : "customer",
    status: "active",
    tokenVersion: 1,
    passwordHash: await hashPassword(password),
  });

  // Dispatch Welcome Transactional Email (async, non-blocking)
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    emailService.send({
      templateId: "auth_welcome",
      recipientEmail: user.email,
      recipientName: user.name,
      data: {
        customer_name: user.name,
        customer_email: user.email,
        login_url: `${siteUrl}/account`,
      },
      idempotencyKey: `welcome_${user.id}`,
    }).catch((err) => console.error("Welcome email error:", err));
  } catch {}

  const response = json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status || "active",
      },
    },
    201
  );

  response.cookies.set("qc_session", signSession(user, true), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 86400,
  });

  return response;
}


