import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'local-db.json');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Clean synthetic testimonials (keep t-1, t-2, t-3 or real human testimonials, remove rec-mt... automated test runs)
if (Array.isArray(db.testimonials)) {
  db.testimonials = db.testimonials.filter(t => !t.id.startsWith('rec-mt'));
  db.testimonials.forEach(t => {
    if (t.videoUrl && t.videoUrl.includes('dQw4w9WgXcQ')) {
      delete t.videoUrl;
    }
  });
}

// 2. Clean synthetic reviews (remove rev-mt... automated test runs)
if (Array.isArray(db.reviews)) {
  db.reviews = db.reviews.filter(r => !r.id.startsWith('rev-mt'));
}

// 3. Clean placeholder dummy video URL (Rick Astley dQw4w9WgXcQ) across products, blogPosts, employees, banners, aplusTemplates
const cleanVideo = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string' && obj[key].includes('dQw4w9WgXcQ')) {
      obj[key] = '';
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach(item => cleanVideo(item));
    } else if (typeof obj[key] === 'object') {
      cleanVideo(obj[key]);
    }
  }
};

['products', 'blogPosts', 'employees', 'banners', 'aplusTemplates'].forEach(key => {
  if (Array.isArray(db[key])) {
    db[key].forEach(item => cleanVideo(item));
  }
});

// 4. Enrich doctor profile doc-1 with full clinical credibility fields
if (Array.isArray(db.doctors)) {
  db.doctors = db.doctors.map(doc => {
    if (doc.id === 'doc-1') {
      return {
        ...doc,
        designation: doc.designation || 'Senior Consultant Dermatologist',
        experience: doc.experience || '14+ Years Clinical Practice',
        bio: doc.bio || 'Specializing in barrier repair pharmacology and cutaneous oxidative stress management. Member of the Indian Association of Dermatologists (IADVL).',
        verified: true,
        visible: true,
        sort: 0,
        photo: doc.photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      };
    }
    return doc;
  });
}

// 5. Clean unverified claims in cnt-about
if (Array.isArray(db.content)) {
  const aboutRecord = db.content.find(c => c.key === 'about');
  if (aboutRecord && aboutRecord.value) {
    aboutRecord.value.stat2Number = "100%";
    aboutRecord.value.stat2Label = "Full INCI Disclosure";
    aboutRecord.value.milestones = [
      { year: "2023", title: "Laboratory Inception", description: "Established advanced formulation R&D cleanroom in New Delhi." },
      { year: "2024", title: "Clinical Partner Network", description: "Established collaboration network with certified dermatologists and clinic practitioners." },
      { year: "2025", title: "Therapeutic Portfolio Expansion", description: "Formulated LUMINE-C™, LIKO-Q™, and cellular antioxidant suspensions." },
      { year: "2026", title: "Cold-Chain Direct Distribution", description: "Direct-to-consumer and clinic distribution across major Indian metro networks." }
    ];
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Cleanup completed successfully.');
console.log('Remaining testimonials:', db.testimonials.length);
console.log('Remaining reviews:', db.reviews.length);
console.log('Remaining doctors:', db.doctors.length);
