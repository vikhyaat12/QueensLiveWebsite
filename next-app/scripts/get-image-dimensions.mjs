import fs from "fs";

// Read JPEG header to get dimensions without external libraries
function getJpgDimensions(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    const len = buffer.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  return null;
}

const refPath = "C:/Users/Vikhyaat sikand/.gemini/antigravity/brain/ba7ff11c-20b8-4316-a446-7011631a55ff/.user_uploaded/media_1788789228289.jpg";
if (fs.existsSync(refPath)) {
  const buf = fs.readFileSync(refPath);
  console.log("Ref Dimensions:", getJpgDimensions(buf), "File size:", buf.length);
} else {
  console.log("Not found:", refPath);
}
