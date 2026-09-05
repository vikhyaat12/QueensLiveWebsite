import fs from 'fs';
import path from 'path';

// Minimal PNG/JPEG dimension reader (no dependency needed)
function getImageDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height, format: 'PNG' };
  }
  
  // JPEG
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let i = 2;
    while (i < buf.length - 1) {
      if (buf[i] !== 0xFF) { i++; continue; }
      const marker = buf[i + 1];
      if (marker === 0xD9 || marker === 0xDA) break;
      if ((marker >= 0xC0 && marker <= 0xCF) && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        const height = buf.readUInt16BE(i + 5);
        const width = buf.readUInt16BE(i + 7);
        return { width, height, format: 'JPEG' };
      }
      const segLen = buf.readUInt16BE(i + 2);
      i += 2 + segLen;
    }
  }
  
  // WebP (simple check)
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { width: 0, height: 0, format: 'WebP (dims unknown)' };
  }
  
  return { width: 0, height: 0, format: 'Unknown' };
}

const dir = 'public/images/reference';
const files = [];

function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, f.name);
    if (f.isDirectory()) walk(fp);
    else {
      const s = fs.statSync(fp);
      try {
        const dims = getImageDimensions(fp);
        files.push({ file: fp.replace(/\\/g, '/'), size: s.size, ...dims });
      } catch(e) {
        files.push({ file: fp.replace(/\\/g, '/'), size: s.size, width: 0, height: 0, format: 'Error' });
      }
    }
  }
}
walk(dir);
files.sort((a, b) => b.size - a.size);
console.log('FILE | SIZE | WIDTH x HEIGHT | FORMAT');
console.log('---|---|---|---');
for (const f of files) {
  console.log(`${f.file} | ${(f.size / 1024).toFixed(0)}KB | ${f.width}x${f.height} | ${f.format}`);
}
