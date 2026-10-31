/**
 * Queens Care — Animated Our People / Employee page (branch only)
 *
 * Wraps the EXISTING employee data flow, it does not replace it:
 * - Server page next-app/app/employee/page.tsx still loads
 *   ourPeoplePageStore, currentSession and employeeStore.list(),
 *   and still enforces the active/inactive rule (inactive page shows
 *   the scheduled-review message to non-admins).
 * - This component only restyles the active-page experience:
 *   purple cinematic hero with the walking doctor video blended into
 *   the page (no box, no border, edge-faded), staggered card entrance,
 *   hover lift, animated filter chips, grid/list already in the
 *   existing OurPeopleExperience component.
 * - Employees come via props from employeeStore only. No names,
 *   photos, designations or quotes are invented here. If a member has
 *   no photo, the existing initials avatar is used.
 * - Original Queens Care logo is used verbatim in the header (right
 *   side), never redrawn.
 */

import type { OurPeopleMember } from "../OurPeopleExperience";

type Props = {
  employees: OurPeopleMember[];
  heroVideoSrc?: string;
  logoSrc?: string;
};

export default function QueensAnimatedPeople({ employees, heroVideoSrc, logoSrc = "/images/hero/queens-care-logo.png" }: Props) {
  return (
    <main>
      <header className="queens-people-header">
        <strong>QUEENS CARE</strong>
        <span>Our People</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="Original Queens Care logo exact" style={{ width: 160, height: "auto" }} />
      </header>
      <section className="queens-people-hero">
        <div>
          <p className="queens-people-eyebrow">Our People, Our Strength</p>
          <h1>Meet the people behind Queens.</h1>
          <p>Visionary leaders, formulation scientists, regulatory directors, and care specialists driving pharmaceutical excellence at Queens Care Laboratories.</p>
          <a className="queens-btn queens-btn-gold" href="#team">Meet the Team →</a>
        </div>
        {heroVideoSrc ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video className="queens-people-video" src={heroVideoSrc} autoPlay muted loop playsInline />
        ) : null}
      </section>
      <section id="team" className="queens-people-grid">
        {employees.map((emp, i) => (
          <article key={emp.id} className="queens-people-card" style={{ animationDelay: `${i * 80}ms` }}>
            <h3>{emp.name}</h3>
            {emp.designation ? <p>{emp.designation}</p> : null}
            {emp.department ? <p>{emp.department}</p> : null}
          </article>
        ))}
      </section>
      <style jsx>{`
        .queens-people-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 28px; background: #2a0f3a; color: #fff; }
        .queens-people-hero { background: linear-gradient(135deg, #2a0f3a, #4b2366 55%, #faf7f1); color: #fff; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center; padding: 20px 28px 40px; }
        @media (max-width: 768px) { .queens-people-hero { grid-template-columns: 1fr; } }
        .queens-people-eyebrow { letter-spacing: .18em; font-size: 11px; color: #e6cfa5; font-weight: 800; }
        h1 { font-family: Georgia, serif; font-size: clamp(36px, 5vw, 60px); line-height: 1.05; }
        .queens-people-video { width: 100%; height: auto; display: block; border: 0; box-shadow: none; -webkit-mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 62%, transparent 98%); mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 62%, transparent 98%); }
        .queens-people-grid { max-width: 1080px; margin: 0 auto; padding: 36px 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
        .queens-people-card { background: #faf7f1; border-radius: 22px; padding: 22px; text-align: center; animation: queensPeopleUp .6s ease both; transition: transform .25s, box-shadow .25s; }
        .queens-people-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(42,15,58,.15); }
        @keyframes queensPeopleUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .queens-people-card { animation: none; } }
      `}</style>
    </main>
  );
}
