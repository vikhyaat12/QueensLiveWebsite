import { json } from "@/lib/http";
import { otpService, OtpChannel, OtpPurpose } from "@/lib/auth/otp-service";
import { extractClientMeta } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid payload" }, 400);

  const identifier = String(body.identifier || body.email || body.phone || "").trim();
  const channel = (body.channel || "email") as OtpChannel;
  const purpose = (body.purpose || "login") as OtpPurpose;
  const recipientName = body.name ? String(body.name).trim() : undefined;

  if (!identifier) {
    return json({ error: "Identifier (email or phone) is required." }, 422);
  }

  if (channel !== "email" && channel !== "sms" && channel !== "whatsapp") {
    return json({ error: "Invalid OTP channel. Must be 'email', 'sms', or 'whatsapp'." }, 422);
  }

  const validPurposes: OtpPurpose[] = ["registration", "login", "password_reset", "phone_verification", "email_verification", "checkout_verification"];
  if (!validPurposes.includes(purpose)) {
    return json({ error: `Invalid purpose. Allowed: ${validPurposes.join(", ")}` }, 422);
  }

  const meta = extractClientMeta(request);
  const result = await otpService.request({
    identifier,
    channel,
    purpose,
    recipientName,
    ip: meta.ip,
  });

  if (!result.ok) {
    return json({ error: result.error, cooldownSeconds: result.cooldownSeconds }, 429);
  }

  return json({
    ok: true,
    channel: result.channel,
    cooldownSeconds: result.cooldownSeconds,
    expiresInSeconds: result.expiresInSeconds,
    // In simulated/test mode, return simulatedCode to facilitate automated testing
    simulatedCode: result.simulatedCode,
  });
}
