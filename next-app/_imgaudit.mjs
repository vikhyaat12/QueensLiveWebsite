import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = 'public/images/reference';
const files = [];

function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, f.name);
    if (f.isDirectory()) walk(fp);
    else {
      const s = fs.statSync(fp);
      files.push({ file: fp, size: s.size });
    }
  }
}
walk(dir);
files.sort((a, b) => b.size - a.size);
for (const f of files) {
  console.log(`${f.file} | ${(f.size / 1024).toFixed(0)}KB`);
}
