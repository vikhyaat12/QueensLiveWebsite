import { json } from "@/lib/http";
import { otpService, OtpPurpose } from "@/lib/auth/otp-service";
import { extractClientMeta, logAccessAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid payload" }, 400);

  const identifier = String(body.identifier || body.email || body.phone || "").trim();
  const purpose = (body.purpose || "login") as OtpPurpose;
  const code = String(body.code || body.otp || "").trim();

  if (!identifier || !code) {
    return json({ error: "Identifier and verification code are required." }, 422);
  }

  const result = await otpService.verify(identifier, purpose, code);
  const meta = extractClientMeta(request);

  if (!result.valid) {
    await logAccessAuditEvent({
      action: "otp_verification_failed",
      actorId: "anonymous",
      actorName: "Guest",
      actorEmail: identifier.includes("@") ? identifier : "",
      targetId: identifier,
      targetName: identifier,
      targetEmail: identifier.includes("@") ? identifier : "",
      reason: result.error || "Incorrect OTP code",
      ip: meta.ip,
      userAgent: meta.userAgent,
      status: "failure",
      details: `Failed OTP attempt for ${purpose} on ${identifier}.`,
    });

    return json({ error: result.error }, 401);
  }

  await logAccessAuditEvent({
    action: "otp_verification_success",
    actorId: "authenticated_via_otp",
    actorName: identifier,
    actorEmail: identifier.includes("@") ? identifier : "",
    targetId: identifier,
    targetName: identifier,
    targetEmail: identifier.includes("@") ? identifier : "",
    reason: `Successfully verified OTP for ${purpose}`,
    ip: meta.ip,
    userAgent: meta.userAgent,
    status: "success",
    details: `Successful OTP verification for ${purpose} on ${identifier}.`,
  });

  return json({
    ok: true,
    verificationToken: result.verificationToken,
    identifier: result.identifier,
    purpose: result.purpose,
  });
}
