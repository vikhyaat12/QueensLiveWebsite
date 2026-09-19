import { fileDb } from "@/lib/commerce/file-db";
import { otpSettingsStore, OTPSettings } from "@/lib/commerce/store-extensions";
import { emailService } from "@/lib/email/email-service";
import { smsService } from "@/lib/sms/sms-service";
import { whatsAppService } from "@/lib/whatsapp/whatsapp-service";
import { randomInt, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export type OtpChannel = "email" | "sms" | "whatsapp";
export type OtpPurpose = "registration" | "login" | "password_reset" | "phone_verification" | "email_verification" | "checkout_verification";

export interface OtpRecord {
  id: string;
  identifier: string; // email or phone number
  channel: OtpChannel;
  purpose: OtpPurpose;
  hash: string;
  salt: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: string;
  cooldownUntil: string;
  createdAt: string;
}

export interface RequestOtpOptions {
  identifier: string; // email address or phone number
  channel: OtpChannel;
  purpose: OtpPurpose;
  recipientName?: string;
  ip?: string;
}

export interface RequestOtpResult {
  ok: boolean;
  channel: OtpChannel;
  cooldownSeconds: number;
  expiresInSeconds: number;
  error?: string;
  simulatedCode?: string; // only present in dev/test mode when simulated
}

export interface VerifyOtpResult {
  valid: boolean;
  error?: string;
  verificationToken?: string;
  identifier?: string;
  purpose?: OtpPurpose;
}

function hashOtp(code: string, salt: string): string {
  return scryptSync(code, salt, 32).toString("hex");
}

function getStoreKey(identifier: string, purpose: string): string {
  return `otp_${purpose}_${identifier.toLowerCase().trim()}`;
}

export const otpService = {
  request: async (options: RequestOtpOptions): Promise<RequestOtpResult> => {
    const { identifier, channel, purpose, recipientName = "Valued Customer", ip } = options;
    const settings: OTPSettings = await otpSettingsStore.get();

    // 1. Channel Enablement Verification
    if (channel === "email" && !settings.emailOtpEnabled) {
      return { ok: false, channel, cooldownSeconds: 0, expiresInSeconds: 0, error: "Email OTP authentication is currently disabled by administrator." };
    }
    if (channel === "sms" && !settings.smsOtpEnabled) {
      return { ok: false, channel, cooldownSeconds: 0, expiresInSeconds: 0, error: "SMS OTP authentication is currently disabled by administrator." };
    }
    if (channel === "whatsapp" && !settings.whatsappOtpEnabled) {
      return { ok: false, channel, cooldownSeconds: 0, expiresInSeconds: 0, error: "WhatsApp OTP authentication is currently disabled by administrator." };
    }

    const cleanIdentifier = identifier.toLowerCase().trim();
    const storeKey = getStoreKey(cleanIdentifier, purpose);
    const now = Date.now();

    // 2. Cooldown & Brute Force Rate-Limit Inspection
    const existingRaw = fileDb.findOne("settings", (s: Record<string, unknown>) => s.key === storeKey);
    if (existingRaw?.value) {
      try {
        const existing: OtpRecord = typeof existingRaw.value === "string" ? JSON.parse(existingRaw.value) : existingRaw.value;
        const cooldownRemaining = Math.ceil((new Date(existing.cooldownUntil).getTime() - now) / 1000);
        if (cooldownRemaining > 0) {
          return {
            ok: false,
            channel,
            cooldownSeconds: cooldownRemaining,
            expiresInSeconds: 0,
            error: `Please wait ${cooldownRemaining} seconds before requesting a new verification code.`,
          };
        }
      } catch {}
    }

    // 3. Generate Cryptographically Secure 6-Digit Numeric OTP
    const otpCode = String(randomInt(100000, 999999));
    const salt = randomBytes(16).toString("hex");
    const hash = hashOtp(otpCode, salt);

    const expiryMs = (settings.expiryMinutes || 5) * 60 * 1000;
    const cooldownMs = (settings.resendCooldownSeconds || 60) * 1000;
    const maxAttempts = settings.maxAttempts || 5;

    const record: OtpRecord = {
      id: `OTP-${now}-${randomBytes(3).toString("hex").toUpperCase()}`,
      identifier: cleanIdentifier,
      channel,
      purpose,
      hash,
      salt,
      attempts: 0,
      maxAttempts,
      expiresAt: new Date(now + expiryMs).toISOString(),
      cooldownUntil: new Date(now + cooldownMs).toISOString(),
      createdAt: new Date(now).toISOString(),
    };

    // 4. Save to Database
    fileDb.update(
      "settings",
      { key: storeKey },
      {
        key: storeKey,
        value: JSON.stringify(record),
        group: "otp_active_sessions",
        updatedAt: new Date().toISOString(),
      }
    );

    // 5. Dispatch via Selected Channel
    const messageText = `Your Queens Care Laboratories verification code is: ${otpCode}. Valid for ${settings.expiryMinutes || 5} minutes. Do not share this code with anyone.`;

    let simulated = false;

    if (channel === "email") {
      const emailResult = await emailService.send({
        templateId: "auth_password_reset", // or dedicated otp template
        recipientEmail: cleanIdentifier,
        recipientName,
        overrideSubject: `Your Queens Care Verification Code: ${otpCode}`,
        overrideHtml: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #FAF8F5; border-radius: 8px;">
            <h2 style="color: #2A0F3A; margin: 0 0 16px;">Queens Care Security Verification</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.5;">Hello ${recipientName},</p>
            <p style="color: #555; font-size: 15px; line-height: 1.5;">Use the following single-use verification code to complete your ${purpose.replace("_", " ")}:</p>
            <div style="margin: 24px 0; text-align: center;">
              <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2A0F3A; background: #fff; padding: 16px 32px; border: 2px solid #D4AF37; border-radius: 8px;">
                ${otpCode}
              </span>
            </div>
            <p style="color: #888; font-size: 13px;">This code will expire in ${settings.expiryMinutes || 5} minutes. If you did not make this request, please contact care@queenscare.in immediately.</p>
          </div>
        `,
        data: {
          customer_name: recipientName,
          otp_code: otpCode,
          expiry_minutes: settings.expiryMinutes || 5,
        },
      });
      simulated = emailResult.simulated;
    } else if (channel === "sms") {
      const smsResult = await smsService.send({
        to: cleanIdentifier,
        message: messageText,
      });
      simulated = smsResult.simulated;
    } else if (channel === "whatsapp") {
      const waResult = await whatsAppService.send({
        to: cleanIdentifier,
        bodyText: messageText,
      });
      simulated = waResult.simulated;
    }

    return {
      ok: true,
      channel,
      cooldownSeconds: settings.resendCooldownSeconds || 60,
      expiresInSeconds: (settings.expiryMinutes || 5) * 60,
      simulatedCode: simulated ? otpCode : undefined,
    };
  },

  verify: async (identifier: string, purpose: OtpPurpose, inputCode: string): Promise<VerifyOtpResult> => {
    const cleanIdentifier = identifier.toLowerCase().trim();
    const cleanCode = inputCode.replace(/[^0-9]/g, "").trim();
    const storeKey = getStoreKey(cleanIdentifier, purpose);

    const recordRaw = fileDb.findOne("settings", (s: Record<string, unknown>) => s.key === storeKey);
    if (!recordRaw?.value) {
      return { valid: false, error: "No active verification session found. Please request a new code." };
    }

    let record: OtpRecord;
    try {
      record = typeof recordRaw.value === "string" ? JSON.parse(recordRaw.value) : (recordRaw.value as OtpRecord);
    } catch {
      return { valid: false, error: "Malformed verification session." };
    }

    const now = Date.now();

    // 1. Expiry Check
    if (new Date(record.expiresAt).getTime() < now) {
      fileDb.remove("settings", { key: storeKey });
      return { valid: false, error: "Verification code has expired. Please request a new code." };
    }

    // 2. Maximum Attempts / Brute-Force Check
    if (record.attempts >= record.maxAttempts) {
      fileDb.remove("settings", { key: storeKey });
      return {
        valid: false,
        error: "Maximum verification attempts exceeded. For your security, this code has been revoked. Please request a new code.",
      };
    }

    // Increment attempts
    record.attempts += 1;

    // 3. Timing-Safe Hash Comparison
    const candidateHash = hashOtp(cleanCode, record.salt);
    const hashBuf = Buffer.from(record.hash, "hex");
    const candidateBuf = Buffer.from(candidateHash, "hex");

    const matches = hashBuf.length === candidateBuf.length && timingSafeEqual(hashBuf, candidateBuf);

    if (!matches) {
      // Save incremented attempts
      fileDb.update(
        "settings",
        { key: storeKey },
        {
          key: storeKey,
          value: JSON.stringify(record),
          updatedAt: new Date().toISOString(),
        }
      );

      const attemptsRemaining = record.maxAttempts - record.attempts;
      return {
        valid: false,
        error: attemptsRemaining > 0
          ? `Incorrect verification code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} remaining.`
          : "Maximum verification attempts exceeded. Code revoked.",
      };
    }

    // 4. Success: Invalidate OTP session & issue single-use verification token
    fileDb.remove("settings", { key: storeKey });
    const verificationToken = `VTOK-${Date.now()}-${randomBytes(16).toString("hex")}`;

    // Store verified token with 15-minute validity for the downstream action
    fileDb.insert("settings", {
      key: `vtok_${verificationToken}`,
      value: JSON.stringify({
        identifier: cleanIdentifier,
        purpose,
        verifiedAt: new Date().toISOString(),
        expiresAt: new Date(now + 15 * 60 * 1000).toISOString(),
      }),
      group: "otp_verified_tokens",
      updatedAt: new Date().toISOString(),
    });

    return {
      valid: true,
      verificationToken,
      identifier: cleanIdentifier,
      purpose,
    };
  },
};
