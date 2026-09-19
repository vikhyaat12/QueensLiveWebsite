# Queens Care Laboratories — Enterprise Pharmaceutical E-Commerce Platform

Queens Care Laboratories is a clinical-luxury pharmaceutical e-commerce platform engineered for an aspirational 5%+ conversion rate, zero hardcoded business rules, omnichannel communication (Email, SMS, WhatsApp, Push), and 100% hosting portability.

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm ci

# 2. Setup environment variables
copy .env.example .env.local

# 3. Start local development server (Turbopack)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Verification & Build

```bash
# Type check (0 errors)
npx tsc --noEmit

# Lint check (0 errors)
npx eslint . --quiet

# Production build (129/129 routes compiled)
npm run build

# Start production server
npm start -- -p 3000
```

---

## Documentation Index

- [System Architecture Specification](docs/ARCHITECTURE.md)
- [Master Production Deployment Guide](docs/DEPLOYMENT.md) (Vercel, Docker, Node.js VPS)
- [Hosting & Database Migration Runbook](docs/MIGRATION.md)
- [Environment Variables Reference](.env.example)

---

## Key System Features

1. **Omnichannel Communications Engine**:
   - Central Transactional Email Engine with 13 standardized branded templates.
   - Multi-provider SMS Service (Twilio, MSG91, Fast2SMS, Generic Webhooks).
   - Multi-provider WhatsApp Service (Meta Cloud API, Gupshup, Twilio).
   - Admin Notification Rules Matrix enabling per-event channel toggles.
   - Duplicate send protection via composite idempotency keys.

2. **Secure OTP Authentication**:
   - Salted `scrypt` hashing with constant-time comparison.
   - Brute-force lockout and resend cooldown enforcement.
   - Multi-channel delivery (Email, SMS, WhatsApp).

3. **Authoritative Dual-Tax GST Engine**:
   - Server-authoritative CGST/SGST intra-state split and IGST inter-state allocation.
   - Frozen, immutable tax snapshots for every order.
   - Downloadable automated PDF tax invoices.

4. **Duty Pharmacist & Operations Command Desk**:
   - High-density Operations portal for packing slips and shipping labels.
   - Duty Pharmacist review desk with approval/rejection notes and patient notifications.

5. **Hosting Portability**:
   - Zero-lockin deployment supporting Vercel, Docker containers, and Node.js VPS.
   - Cloud S3 / Cloudflare R2 storage abstraction with automatic local filesystem fallback.
