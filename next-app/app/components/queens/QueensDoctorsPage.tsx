"use client";

/**
 * Queens Care — Doctors Page (branch only, new file)
 *
 * Doctors come via props from /api/doctors (existing API). Registration
 * is delegated to the caller's existing /api/doctor/register handler.
 * The fictional brand character is NOT listed here as a doctor and
 * is not presented as a medical adviser. No doctor credential,
 * endorsement or medical claim is invented.
 */

import QueensSectionShell from "./QueensSectionShell";
import QueensSiteHeader from "./QueensSiteHeader";

export type QueensDoctor = {
  id: string;
  name: string;
  speciality?: string;
  bio?: string;
  photo?: string;
  profileHref?: string;
};

type Props = { doctors: QueensDoctor[]; cartCount?: number; onRegister?: () => void };

export default function QueensDoctorsPage({ doctors, cartCount = 0, onRegister }: Props) {
  return (
    <main>
      <QueensSiteHeader cartCount={cartCount} />
      <QueensSectionShell eyebrow="Doctors" title="Meet our doctors" subtitle="Real doctors from the existing doctors API. The cartoon brand character is a fictional guide, not a listed doctor.">
        {doctors.length === 0 ? <p>No doctors are listed right now. Please check back, or contact us for help.</p> : (
          <div className="queens-doctors-grid">
            {doctors.map((d, i) => (
              <article key={d.id} className="queens-card queens-doctor-card" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
                {d.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.photo} alt={d.name} loading="lazy" />
                ) : null}
                <h3>{d.name}</h3>
                {d.speciality ? <p><strong>{d.speciality}</strong></p> : null}
                {d.bio ? <p>{d.bio}</p> : null}
                {d.profileHref ? <a className="queens-btn queens-btn-outline" href={d.profileHref}>View Profile</a> : null}
              </article>
            ))}
          </div>
        )}
        <div className="queens-doctors-cta">
          <p>Are you a doctor? Register through the existing doctor registration flow.</p>
          <button type="button" className="queens-btn queens-btn-gold" onClick={onRegister}>Register as a Doctor</button>
        </div>
      </QueensSectionShell>
      <style>{`
        .queens-doctors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
        .queens-doctor-card { padding: 20px; animation: queensDocUp .5s ease both; }
        .queens-doctor-card img { width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; border-radius: 16px; }
        .queens-doctors-cta { margin-top: 32px; background: #faf7f1; border-radius: 20px; padding: 24px; }
        @keyframes queensDocUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .queens-doctor-card { animation: none; } }
      `}</style>
    </main>
  );
}
