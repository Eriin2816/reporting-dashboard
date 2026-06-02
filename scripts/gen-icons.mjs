import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { deflateSync } from 'zlib';

// CRC32 table (for PNG chunk CRCs)
const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  return c;
});
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const l = Buffer.alloc(4); l.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, c]);
}

function buildPNG(sz, pixels) {
  const hdr = Buffer.alloc(13);
  hdr.writeUInt32BE(sz, 0); hdr.writeUInt32BE(sz, 4);
  hdr[8] = 8; hdr[9] = 6; // RGBA
  const raw = Buffer.alloc(sz * (1 + sz * 4));
  for (let y = 0; y < sz; y++) {
    const base = y * (1 + sz * 4);
    raw[base] = 0; // filter: none
    for (let x = 0; x < sz; x++) {
      const { r, g, b, a = 255 } = pixels(x, y, sz);
      const p = base + 1 + x * 4;
      raw[p] = r; raw[p+1] = g; raw[p+2] = b; raw[p+3] = a;
    }
  }
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', hdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// DashPro icon: navy background (#0a1424) with centered blue badge and "D" letterform
function iconPixels(x, y, sz) {
  // Background: navy #0a1424
  const bg = { r: 10, g: 20, b: 36 };
  // Badge: rounded square occupying 60% of icon, bright blue #2563eb
  const margin = sz * 0.18;
  const bx = x - sz * 0.5;
  const by = y - sz * 0.5;
  const half = sz * 0.5 - margin;
  const radius = sz * 0.12;

  // Is point inside the rounded square?
  const inBadge =
    Math.abs(bx) <= half &&
    Math.abs(by) <= half &&
    !(Math.abs(bx) > half - radius && Math.abs(by) > half - radius &&
      Math.hypot(Math.abs(bx) - (half - radius), Math.abs(by) - (half - radius)) > radius);

  if (!inBadge) return bg;

  // "D" letterform inside the badge
  // Spine: vertical bar on the left 1/3
  const relX = (x / sz - 0.5); // -0.5 to 0.5
  const relY = (y / sz - 0.5);
  const spineLeft = -0.12;
  const spineRight = -0.04;
  const topY = -0.22;
  const botY = 0.22;
  const inSpine = relX >= spineLeft && relX <= spineRight && relY >= topY && relY <= botY;

  // D curve: ellipse right side
  const cx = -0.04; // center x of ellipse
  const a2 = 0.19 * 0.19; // semi-major (x)
  const b2 = 0.22 * 0.22; // semi-minor (y)
  const dx = relX - cx;
  const dy = relY;
  const inCurveOuter = (dx * dx) / a2 + (dy * dy) / b2 <= 1 && relX >= spineLeft;
  const inCurveInner = (dx * dx) / (a2 * 0.45) + (dy * dy) / (b2 * 0.55) <= 1 && relX > spineRight + 0.01;
  const inCurve = inCurveOuter && !inCurveInner;

  if (inSpine || inCurve) {
    return { r: 255, g: 255, b: 255 }; // white letter
  }
  return { r: 37, g: 99, b: 235 }; // blue badge background
}

if (!existsSync('public')) mkdirSync('public');

for (const sz of [192, 512]) {
  const buf = buildPNG(sz, iconPixels);
  writeFileSync(`public/icon-${sz}.png`, buf);
  console.log(`public/icon-${sz}.png  (${(buf.length / 1024).toFixed(1)} KB)`);
}
console.log('Icons generated.');
