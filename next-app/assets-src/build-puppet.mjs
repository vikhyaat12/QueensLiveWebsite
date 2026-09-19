/* ═══════════════════════════════════════════════════════════════════════
   Queens Care Laboratories — Doctor Puppet Asset Pipeline (v4 FINAL)
   Slices the APPROVED character render into articulated 2.5D layers.

   Every identity pixel (face/hair/coat/bag) comes from the approved image.
   Fabric hidden by limbs is reconstructed by cloning/stretching real
   fabric so layers can articulate without gaps.

   Outputs → public/images/puppet/*.webp + puppet-manifest.json
   Run: node assets-src/build-puppet.mjs
   ═══════════════════════════════════════════════════════════════════════ */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("assets-src/dr-approved.png");
const OUT = path.resolve("public/images/puppet");
fs.mkdirSync(OUT, { recursive: true });

const W = 1024, H = 1536;

/* ── raw buffer helpers ─────────────────────────────────────────────── */
async function loadRawBuf(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, ch: info.channels };
}
function px(buf, x, y) {
  x = Math.max(0, Math.min(buf.w - 1, Math.round(x)));
  y = Math.max(0, Math.min(buf.h - 1, Math.round(y)));
  const i = (y * buf.w + x) * buf.ch;
  return [buf.data[i], buf.data[i + 1], buf.data[i + 2]];
}
function setPx(buf, x, y, rgb) {
  if (x < 0 || y < 0 || x >= buf.w || y >= buf.h) return;
  const i = (y * buf.w + x) * buf.ch;
  buf.data[i] = rgb[0]; buf.data[i + 1] = rgb[1]; buf.data[i + 2] = rgb[2]; buf.data[i + 3] = 255;
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function patchColor(buf, cx, cy, r = 2) {
  let c = [0, 0, 0], n = 0;
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    const p = px(buf, x, y); c = [c[0] + p[0], c[1] + p[1], c[2] + p[2]]; n++;
  }
  return [c[0] / n, c[1] / n, c[2] / n];
}

/* Feathered donor clone (resized to target). */
async function clonePatch(buf, donor, target, { feather = 0.25 } = {}) {
  const [dx, dy, dw, dh] = donor;
  const [tx, ty, tw, th] = target.length === 2 ? [target[0], target[1], dw, dh] : target;
  const gradMask = Buffer.from(
    `<svg width="${tw}" height="${th}"><defs><radialGradient id="g">
      <stop offset="0" stop-color="#fff"/><stop offset="${1 - feather}" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
    </radialGradient></defs><rect width="${tw}" height="${th}" fill="url(#g)"/></svg>`
  );
  const mask = await sharp(gradMask).extractChannel(0).raw().toBuffer();
  const patchBuf = await sharp(SRC).extract({ left: dx, top: dy, width: dw, height: dh })
    .resize(tw, th, { fit: "fill" }).ensureAlpha().raw().toBuffer();
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    const m = mask[y * tw + x] / 255;
    if (m <= 0.01) continue;
    const pi = (y * tw + x) * 4;
    setPx(buf, tx + x, ty + y, mix(px(buf, tx + x, ty + y), [patchBuf[pi], patchBuf[pi + 1], patchBuf[pi + 2]], m));
  }
}

/* Rect fill from a linear vertical gradient of anchor rows (top & bottom). */
function vGradFill(buf, x0, y0, x1, y1, cTop, cBot) {
  for (let y = y0; y <= y1; y++) {
    const t = y0 === y1 ? 0 : (y - y0) / (y1 - y0);
    const c = mix(cTop, cBot, t);
    for (let x = x0; x <= x1; x++) setPx(buf, x, y, c);
  }
}

function softBlurRect(buf, x0, y0, x1, y1, r = 3) {
  const copy = Buffer.from(buf.data);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0, n = 0;
      for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= buf.w || yy >= buf.h) continue;
        sum += copy[(yy * buf.w + xx) * buf.ch + c]; n++;
      }
      buf.data[(y * buf.w + x) * buf.ch + c] = sum / n;
    }
  }
}

/* Edge shading: darken toward one side (turn-away shadow). */
function edgeShade(buf, x0, y0, x1, y1, side, width, amount) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const d = side === "left" ? (x - x0) / width : side === "right" ? (x1 - x) / width : (y1 - y) / width;
    if (d < 1) {
      const c = px(buf, x, y);
      setPx(buf, x, y, mix(c, [c[0] * 0.5, c[1] * 0.46, c[2] * 0.6], (1 - Math.max(0, d)) * amount));
    }
  }
}

async function cutPiece(srcBuf, piece) {
  const { path: d, name, bbox, feather = 1.4, evenodd = false } = piece;
  const maskSvg = Buffer.from(`<svg width="${W}" height="${H}"><path d="${d}" fill="#fff"${evenodd ? ` fill-rule="evenodd"` : ""}/></svg>`);
  const maskBlur = await sharp(maskSvg).extractChannel(0).blur(feather).raw().toBuffer();
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    out[i * 4] = srcBuf.data[i * 4];
    out[i * 4 + 1] = srcBuf.data[i * 4 + 1];
    out[i * 4 + 2] = srcBuf.data[i * 4 + 2];
    out[i * 4 + 3] = maskBlur[i];
  }
  const [x0, y0, x1, y1] = bbox;
  await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
    .png().toFile(path.join(OUT, `${name}.png`));
}

async function drawOverPiece(piece, svgBody) {
  const [x0, y0, x1, y1] = piece.bbox;
  const w = x1 - x0, h = y1 - y0;
  const overlay = Buffer.from(`<svg width="${w}" height="${h}">${svgBody}</svg>`);
  const base = path.join(OUT, `${piece.name}.png`);
  const tmp = base + ".tmp.png";
  await sharp(base).composite([{ input: overlay, left: 0, top: 0 }]).png().toFile(tmp);
  fs.renameSync(tmp, base);
}

/* ═══ 1. Torso source: remove arms, rebuild coat fabric beneath ══════ */
async function buildTorsoSource() {
  const buf = await loadRawBuf(SRC);

  /* RIGHT (viewer-left) sleeve overlapped the coat's left edge, x≈311-438,
     y≈425-665. Rebuild by stretching clean panel fabric from below over the
     hole, then re-draw the coat's outer edge with a turn-away shadow. */
  await clonePatch(buf, [312, 700, 122, 88], [318, 428, 116, 190], { feather: 0.12 });
  await clonePatch(buf, [318, 760, 60, 40], [318, 612, 60, 56], { feather: 0.12 });
  edgeShade(buf, 300, 425, 340, 665, "left", 22, 0.38);
  softBlurRect(buf, 300, 420, 444, 672, 3);

  /* LEFT (viewer-right) arm hung over the coat's right side, x≈634-770,
     y≈415-760 (sleeve) and the hand over the panel, y≈745-905.
     The coat narrows there — reconstruct a modest edge, not the sleeve bulge. */
  // 1) main side fabric: stretch clean closure-side fabric rightward
  await clonePatch(buf, [556, 430, 70, 120], [628, 424, 74, 340], { feather: 0.1 });
  // 2) hand hole over the panel below y745
  await clonePatch(buf, [630, 918, 56, 26], [628, 742, 60, 158], { feather: 0.12 });
  // 3) new coat edge column (outer boundary continues under where sleeve was)
  vGradFill(buf, 686, 420, 702, 500, patchColor(buf, 676, 424), patchColor(buf, 682, 498));
  vGradFill(buf, 694, 500, 712, 600, patchColor(buf, 690, 502), patchColor(buf, 700, 598));
  vGradFill(buf, 700, 600, 710, 700, patchColor(buf, 698, 602), patchColor(buf, 690, 698));
  vGradFill(buf, 690, 700, 700, 762, patchColor(buf, 688, 702), patchColor(buf, 676, 760));
  edgeShade(buf, 660, 420, 704, 762, "right", 30, 0.4);
  softBlurRect(buf, 620, 418, 706, 764, 3);
  edgeShade(buf, 626, 742, 690, 902, "right", 26, 0.3);
  softBlurRect(buf, 624, 740, 692, 904, 3);

  /* Vertical seam shadow where the sleeve used to meet the coat — keeps a
     soft fold line reading on both sides (fabric memory). */
  for (const [sx, sy0, sy1] of [[424, 430, 640], [642, 430, 720]]) {
    for (let y = sy0; y <= sy1; y++) {
      const c = px(buf, sx, y);
      for (let x = sx - 4; x <= sx + 4; x++) {
        const d = 1 - Math.abs(x - sx) / 4;
        setPx(buf, x, y, mix(px(buf, x, y), [c[0] * 0.82, c[1] * 0.8, c[2] * 0.86], d * 0.35));
      }
    }
  }
  return buf;
}

/* ═══ 2. Back-leg source: rebuild thigh under the crossing front leg ═ */
async function buildLegBackSource() {
  const buf = await loadRawBuf(SRC);
  const bands = [
    [498, 1032, 542, 1090],
    [488, 1090, 546, 1140],
    [474, 1140, 546, 1186],
    [454, 1186, 540, 1216],
  ];
  for (const [x0, y0, x1, y1] of bands) {
    for (let y = y0; y <= y1; y++) {
      const c0 = patchColor(buf, x0 - 4, y, 1);
      const c1 = patchColor(buf, x1 + 4, y, 1);
      for (let x = x0; x <= x1; x++) {
        const t = (x - x0) / Math.max(1, x1 - x0);
        let c = mix(c0, c1, t * t * (3 - 2 * t));
        const d = (x1 - x) / 20;
        if (d < 1) c = mix(c, [c[0] * 0.48, c[1] * 0.44, c[2] * 0.62], (1 - d) * 0.45);
        setPx(buf, x, y, c);
      }
    }
    softBlurRect(buf, x0, y0, x1, y1, 2);
  }
  return buf;
}

/* ═══ 3. Pelvis source: extend navy hip fabric up under the scrub hem ═ */
async function buildPelvisSource() {
  const buf = await loadRawBuf(SRC);
  /* Donor: clean navy thigh-crotch fabric. Stretch upward + sideways to
     blanket the whole pelvis box so scissoring thighs never reveal gaps. */
  await clonePatch(buf, [520, 880, 130, 120], [470, 838, 226, 250], { feather: 0.08 });
  softBlurRect(buf, 480, 845, 690, 1075, 4);
  return buf;
}

/* ═══ 4. Piece definitions — grid-traced against the approved render ═ */
const PIECES = [
  {
    name: "head", bbox: [344, 12, 696, 424],
    path: `M 470 418 L 464 382 Q 458 348 448 326 Q 428 312 412 292 Q 396 270 386 242 Q 374 206 370 172 Q 378 120 400 88 Q 426 52 468 34 Q 504 20 540 22 Q 580 24 610 44 Q 640 64 656 96 Q 672 128 674 166 Q 676 206 666 242 Q 658 272 640 294 Q 622 314 600 320 Q 596 342 588 362 Q 584 390 586 418 Z`,
  },
  {
    /* torso = scrub top + coat panels; coat opening cut at the scrub hem
       (navy pelvis owns the opening); right side narrowed to the true
       coat edge (sleeve bulge removed). */
    name: "torso", bbox: [286, 328, 792, 1064],
    path: `M 448 358 Q 470 340 500 336 L 556 336 Q 590 340 598 356 Q 640 378 678 404 Q 700 424 702 448 Q 706 480 698 520 Q 706 560 710 600 Q 708 640 700 680 Q 704 720 698 756 Q 688 792 682 830 Q 678 862 678 900 Q 672 940 660 972 Q 648 1002 634 1030 L 620 1036 L 630 843 L 560 856 L 536 858 L 540 900 L 546 948 L 540 985 L 500 1000 L 462 1016 L 430 1032 L 400 1044 L 372 1040 L 344 1036 L 316 1030 L 300 952 L 300 880 L 304 800 L 310 700 L 316 620 L 324 520 L 336 452 L 366 415 Q 382 402 398 392 L 428 372 Z`,
  },
  {
    name: "pelvis", bbox: [462, 832, 700, 1090],
    path: `M 478 846 L 688 838 L 694 1000 L 680 1064 L 600 1086 L 520 1078 L 472 1030 Z`,
  },
  {
    name: "arm-r-upper", bbox: [264, 380, 448, 668],
    path: `M 350 404 Q 386 390 424 398 L 438 408 Q 424 456 402 504 Q 380 552 352 596 L 330 624 L 282 638 Q 298 592 316 544 Q 334 486 344 436 Z`,
  },
  {
    /* top edge extends 14px up into the upper-arm piece (hidden overlap) */
    name: "arm-r-fore", bbox: [226, 586, 368, 894],
    path: `M 278 626 L 336 612 Q 324 656 310 694 L 296 728 Q 288 748 282 764 L 276 786 L 262 792 L 250 812 L 242 838 L 248 862 L 268 876 L 296 878 L 316 866 L 324 840 L 328 806 L 334 772 L 342 732 L 350 690 L 344 656 Z`,
  },
  {
    name: "arm-l-upper", bbox: [618, 386, 786, 700],
    path: `M 636 410 Q 672 394 712 398 L 740 420 L 750 472 Q 748 540 736 606 L 724 650 L 686 642 Q 678 592 666 536 Q 652 474 640 432 Z`,
  },
  {
    /* top edge extends 14px up into the upper-arm piece (hidden overlap) */
    name: "arm-l-fore", bbox: [672, 618, 826, 892],
    path: `M 682 630 L 728 638 Q 730 678 736 714 L 740 744 L 736 764 L 744 782 L 758 800 L 776 822 L 792 848 L 798 868 L 788 880 L 772 872 L 756 848 L 742 822 L 730 796 L 722 764 L 714 728 L 704 688 Z`,
  },
  {
    name: "leg-f-thigh", bbox: [470, 850, 730, 1210],
    path: `M 540 880 L 668 868 Q 700 900 710 960 L 716 1060 L 716 1160 Q 700 1180 660 1188 L 600 1180 L 566 1120 L 546 1040 L 536 950 Z`,
  },
  {
    /* top edge extends 16px up into the thigh (hidden overlap) */
    name: "leg-f-shin", bbox: [556, 1120, 902, 1395],
    path: `M 570 1170 L 676 1142 L 690 1196 L 712 1252 L 736 1300 L 748 1334 L 742 1356 L 700 1362 L 662 1354 L 646 1298 L 624 1230 L 600 1196 Z`,
  },
  {
    name: "leg-b-thigh", bbox: [350, 940, 560, 1250],
    path: `M 368 1042 L 452 1018 L 515 1032 L 532 1080 L 538 1140 L 530 1190 L 432 1228 L 404 1190 L 390 1130 L 378 1080 Z`,
  },
  {
    /* top edge extends 16px up into the thigh (hidden overlap) */
    name: "leg-b-shin", bbox: [262, 1170, 540, 1372],
    path: `M 428 1214 L 524 1178 L 516 1228 L 502 1270 L 486 1296 L 472 1312 L 456 1330 L 434 1344 L 404 1350 L 374 1348 L 344 1338 L 324 1324 L 310 1304 L 302 1278 L 308 1254 L 324 1234 L 350 1220 L 390 1212 Z`,
  },
  {
    /* front shoe — toe points RIGHT (walk direction) */
    name: "shoe-r", bbox: [680, 1330, 906, 1484],
    path: `M 700 1372 Q 724 1350 758 1358 Q 800 1376 840 1400 Q 866 1418 876 1440 Q 880 1454 862 1464 Q 826 1472 786 1464 Q 744 1452 714 1434 Q 696 1420 692 1396 Z`,
  },
  {
    /* back shoe — toe points LEFT (trailing foot, turned out at rest) */
    name: "shoe-l", bbox: [258, 1300, 480, 1462],
    path: `M 462 1352 L 468 1380 L 458 1418 Q 430 1438 380 1444 Q 320 1448 292 1436 Q 278 1426 282 1408 Q 292 1390 330 1382 Q 380 1372 420 1362 Q 444 1354 462 1352 Z`,
  },
  {
    /* bag lid — front flap + handle strap; fist area excluded (evenodd) */
    name: "bag-lid", bbox: [58, 795, 420, 1000], evenodd: true,
    path: `M 128 896 Q 158 846 204 820 Q 252 806 298 822 Q 334 848 354 890 L 348 902 Q 326 866 292 848 Q 256 832 220 842 Q 186 852 160 880 L 146 900 Z
            M 72 894 Q 148 872 240 880 Q 330 906 358 928 L 356 962 Q 270 928 176 922 Q 118 924 82 938 Z
            M 236 793 L 327 793 L 327 878 L 236 878 Z`,
  },
  {
    /* bag body — extended rim up to the fold line so opening shows no gap */
    name: "bag-body", bbox: [28, 872, 440, 1244],
    path: `M 82 941 Q 118 927 176 925 Q 270 931 356 965 L 366 1008 Q 378 1060 382 1112 Q 378 1160 366 1196 Q 330 1216 278 1222 Q 222 1220 174 1208 Q 134 1192 108 1162 Q 90 1128 82 1072 Q 76 1012 82 941 Z
            M 366 1008 Q 384 1030 396 1058 Q 404 1090 400 1120 Q 394 1152 380 1176 L 366 1196 Q 376 1160 380 1120 Q 382 1070 366 1008 Z
            M 100 928 Q 180 906 268 912 Q 330 920 372 942 L 356 965 Q 270 931 176 925 Q 118 927 82 941 Z`,
  },
];

/* ═══ 5. Eyelids (skin above each eye + lash line) ═════════════════════ */
async function cutEyelids() {
  const mk = async (name, left, top, w, h, lashPath) => {
    const skin = await sharp(SRC).extract({ left, top, width: w, height: h }).blur(1.4).png().toBuffer();
    const lash = Buffer.from(`<svg width="${w}" height="${h}"><path d="${lashPath}" stroke="#3A1F12" stroke-width="4.5" fill="none" stroke-linecap="round"/></svg>`);
    await sharp(skin).composite([{ input: lash }]).png().toFile(path.join(OUT, `${name}.png`));
  };
  await mk("lid-l", 446, 184, 68, 24, "M 4 21 Q 34 6 64 19");
  await mk("lid-r", 540, 176, 70, 24, "M 5 20 Q 35 5 66 18");
}

/* ═══ 6. Manifest (rig data for the runtime component) ════════════════ */
const STAGE = { x0: 218, y0: 8, x1: 912, y1: 1482, ground: 1462 };
const RIG = {
  joints: {
    headNeck: [528, 404],
    shoulderR: [365, 412], elbowR: [306, 632], handR: [284, 836],
    shoulderL: [655, 415], elbowL: [712, 655], handL: [772, 862],
    hipR: [470, 952], kneeR: [452, 1186], ankleR: [448, 1362],
    hipL: [590, 948], kneeL: [662, 1160], ankleL: [742, 1362],
    lidHinge: [214, 894],
  },
  pivots: {
    "head": [528, 404],
    "torso": [528, 948],
    "arm-r-upper": [365, 412],
    "arm-r-fore": [306, 632],
    "arm-l-upper": [655, 415],
    "arm-l-fore": [712, 655],
    "leg-f-thigh": [590, 948],
    "leg-f-shin": [662, 1160],
    "leg-b-thigh": [470, 952],
    "leg-b-shin": [452, 1186],
    "shoe-r": [724, 1362],
    "shoe-l": [448, 1362],
    "bag-lid": [214, 894],
    "bag-body": [240, 960],
    "pelvis": [575, 950],
  },
  z: {
    "leg-b-shin": 1, "leg-b-thigh": 2, "shoe-l": 3,
    "leg-f-shin": 4, "leg-f-thigh": 5, "shoe-r": 6,
    "pelvis": 7, "bag-body": 8, "bag-lid": 9,
    "torso": 10,
    "arm-r-fore": 11, "arm-r-upper": 12,
    "arm-l-fore": 11, "arm-l-upper": 12,
    "head": 13,
  },
};

async function writeManifest() {
  const manifest = {
    stage: STAGE,
    rig: RIG,
    pieces: PIECES.map((p) => ({
      name: p.name, file: `/images/puppet/${p.name}.webp`,
      bbox: p.bbox, pivot: RIG.pivots[p.name], z: RIG.z[p.name],
    })),
    lids: [
      { name: "lid-l", file: "/images/puppet/lid-l.webp", box: [446, 184, 68, 24], eye: [476, 210] },
      { name: "lid-r", file: "/images/puppet/lid-r.webp", box: [540, 176, 70, 24], eye: [572, 202] },
    ],
  };
  fs.writeFileSync(path.join(OUT, "puppet-manifest.json"), JSON.stringify(manifest, null, 2));
  /* Generated TS module consumed by DoctorCinematicScene (kept in sync by
     this build). */
  const ts = `/* AUTO-GENERATED by assets-src/build-puppet.mjs — do not edit by hand */\n` +
    `export type PuppetPiece = { name: string; file: string; bbox: [number, number, number, number]; pivot: [number, number]; z: number };\n` +
    `export type PuppetLid = { name: string; file: string; box: [number, number, number, number]; eye: [number, number] };\n` +
    `export const PUPPET_STAGE = ${JSON.stringify(STAGE)} as const;\n` +
    `export const PUPPET_JOINTS = ${JSON.stringify(RIG.joints)} as const;\n` +
    `export const PUPPET_PIECES: PuppetPiece[] = ${JSON.stringify(manifest.pieces)};\n` +
    `export const PUPPET_LIDS: PuppetLid[] = ${JSON.stringify(manifest.lids)};\n`;
  fs.writeFileSync(path.resolve("app/components/puppet-rig.generated.ts"), ts);
}

/* ═══ 7. Contact sheet ═════════════════════════════════════════════════ */
async function contactSheet(pieces) {
  const cell = 250, cols = 4;
  const rows = Math.ceil((pieces.length + 2) / cols) + 1;
  const comps = [];
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    const [x0, y0, x1, y1] = p.bbox;
    const w = x1 - x0, h = y1 - y0;
    const scale = Math.min((cell - 16) / w, (cell - 16) / h);
    const buf = await sharp(path.join(OUT, `${p.name}.png`)).resize(Math.round(w * scale)).png().toBuffer();
    comps.push({ input: buf, left: (i % cols) * cell + 8, top: Math.floor(i / cols) * cell + 8 });
  }
  const order = ["leg-b-thigh", "leg-b-shin", "shoe-l", "leg-f-thigh", "leg-f-shin", "shoe-r", "pelvis", "torso", "bag-body", "bag-lid", "arm-r-upper", "arm-r-fore", "head", "arm-l-upper", "arm-l-fore"];
  const compsFull = order.map((n) => {
    const p = pieces.find((q) => q.name === n);
    return { input: path.join(OUT, `${n}.png`), left: p.bbox[0], top: p.bbox[1] };
  });
  const full = await sharp(Buffer.from(`<svg width="${W}" height="${H}"></svg>`)).composite(compsFull).png().toBuffer();
  const fullBuf = await sharp(full).resize(500).png().toBuffer();
  comps.push({ input: fullBuf, left: cols * cell + 6, top: 8 });
  const svgBase = Buffer.from(`<svg width="${cols * cell + 520}" height="${rows * cell}"><rect width="100%" height="100%" fill="#1d0e2e"/></svg>`);
  await sharp(svgBase).composite(comps).png().toFile(path.join(OUT, "_contact-sheet.png"));
}

/* ═══ run ══════════════════════════════════════════════════════════════ */
(async () => {
  console.log("Patching torso source…");
  const torsoSrc = await buildTorsoSource();
  await sharp(torsoSrc.data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(OUT, "_torso-patched.png"));

  console.log("Patching back-leg source…");
  const legBackSrc = await buildLegBackSource();

  console.log("Patching pelvis source…");
  const pelvisSrc = await buildPelvisSource();

  const rawSrc = await loadRawBuf(SRC);
  console.log("Cutting pieces…");
  for (const p of PIECES) {
    const src = p.name.startsWith("leg-b") ? legBackSrc : p.name === "torso" ? torsoSrc : p.name === "pelvis" ? pelvisSrc : rawSrc;
    await cutPiece(src, p);
    console.log("  ✓", p.name);
  }

  /* Reconstruct the handle-strap apex (was hidden behind the fist) so the
     strap is complete once her hand releases the bag. */
  const lid = PIECES.find((p) => p.name === "bag-lid");
  await drawOverPiece(lid, `
    <path d="M 204 820 Q 252 806 298 822 L 292 848 Q 256 832 220 842 Q 208 846 198 852 L 186 838 Q 194 828 204 820 Z" fill="#41195e"/>
    <path d="M 204 822 Q 252 808 296 824" stroke="#6b3a96" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.85"/>
    <path d="M 236 800 Q 262 792 288 806" stroke="#5a2f82" stroke-width="9" fill="none" stroke-linecap="round"/>`);

  await cutEyelids();

  console.log("WebP + manifest + contact sheet…");
  for (const p of PIECES) {
    await sharp(path.join(OUT, `${p.name}.png`)).webp({ quality: 92, alphaQuality: 95 }).toFile(path.join(OUT, `${p.name}.webp`));
  }
  for (const l of ["lid-l", "lid-r"]) {
    await sharp(path.join(OUT, `${l}.png`)).webp({ quality: 90, alphaQuality: 95 }).toFile(path.join(OUT, `${l}.webp`));
  }
  await writeManifest();
  await contactSheet(PIECES);
  console.log("Done →", OUT);
})();
