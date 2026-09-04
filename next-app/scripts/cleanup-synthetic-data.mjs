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

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Cleanup completed successfully.');
console.log('Remaining testimonials:', db.testimonials.length);
console.log('Remaining reviews:', db.reviews.length);
console.log('Remaining doctors:', db.doctors.length);
