"use client";

/**
 * Queens Care — Contact Page (branch only, new file)
 * Form submission is delegated to the caller's existing /api/contact
 * handler via onSubmit props. Contact details come via props from
 * /api/settings. No email, phone, address or response-time promise
 * is invented here.
 */

import { useState, type FormEvent } from "react";
import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

type Props = {
  cartCount?: number;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  onSubmit?: (data: { name: string; email: string; message: string }) => Promise<void> | void;
};

export default function QueensContactPage({ cartCount = 0, contactEmail, contactPhone, contactAddress, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    try { await onSubmit?.({ name, email, message }); setSent(true); } finally { setSending(false); }
  }
  return (
    <main>
      <QueensSiteHeader cartCount={cartCount} />
      <QueensSectionShell eyebrow="Contact" title="Talk to Queens Care" subtitle="Use the existing contact flow. We show only contact details supplied from settings.">
        <div className="queens-contact-grid">
          <div className="queens-contact-info">
            {contactEmail ? <p><strong>Email:</strong> <a href={`mailto:${contactEmail}`}>{contactEmail}</a></p> : null}
            {contactPhone ? <p><strong>Phone:</strong> <a href={`tel:${contactPhone}`}>{contactPhone}</a></p> : null}
            {contactAddress ? <p><strong>Address:</strong> {contactAddress}</p> : null}
            {!contactEmail && !contactPhone && !contactAddress ? <p>Contact details are loaded from site settings.</p> : null}
            <a className="queens-btn queens-btn-outline" href="/faq">Read FAQ first →</a>
          </div>
          {sent ? (
            <p className="queens-contact-sent">Thank you — your message has been sent through the existing contact flow.</p>
          ) : (
            <form onSubmit={submit} className="queens-contact-form">
              <label>Name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label>Message<textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={5} /></label>
              <button type="submit" className="queens-btn queens-btn-gold" disabled={sending}>{sending ? "Sending…" : "Send Message"}</button>
            </form>
          )}
        </div>
      </QueensSectionShell>
      <style>{`
        .queens-contact-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 900px) { .queens-contact-grid { grid-template-columns: 1fr 1.4fr; } }
        .queens-contact-form { display: grid; gap: 14px; background: #faf7f1; padding: 24px; border-radius: 20px; }
        .queens-contact-form label { font-weight: 700; color: #2a0f3a; display: grid; gap: 6px; }
        .queens-contact-form input, .queens-contact-form textarea { padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(42,15,58,.2); font: inherit; }
        .queens-contact-sent { background: #faf7f1; padding: 24px; border-radius: 20px; font-weight: 700; color: #2a0f3a; }
      `}</style>
    </main>
  );
}
