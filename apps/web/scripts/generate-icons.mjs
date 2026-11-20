// Sinh bộ icon PNG cho PWA bằng Node thuần, không phụ thuộc thư viện ngoài.
// Chạy: pnpm --filter @radar/web run icons
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const GRADIENT_START = [0x4f, 0x46, 0xe5]; // indigo
const GRADIENT_END = [0x8b, 0x5c, 0xf6]; // violet

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0; // filter type 0 (None)
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function renderIcon(size, maxRadiusRatio) {
  const rgba = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;
  const thickness = size * 0.016;
  const dotRadius = size * 0.055;
  const ringRadii = [1 / 3, 2 / 3, 1].map((factor) => maxRadiusRatio * size * factor);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = (x + y) / (2 * Math.max(size - 1, 1));
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);

      let coverage = 0;
      for (const radius of ringRadii) {
        const alpha = Math.min(1, Math.max(0, 1 - Math.abs(distance - radius) / thickness));
        coverage = Math.max(coverage, alpha);
      }
      if (distance <= dotRadius) coverage = 1;

      const offset = (y * size + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const background = GRADIENT_START[channel] + (GRADIENT_END[channel] - GRADIENT_START[channel]) * t;
        rgba[offset + channel] = Math.round(background * (1 - coverage) + 255 * coverage);
      }
      rgba[offset + 3] = 255;
    }
  }

  return rgba;
}

const OUTPUTS = [
  { file: "icon-192.png", size: 192, maxRadiusRatio: 0.4 },
  { file: "icon-512.png", size: 512, maxRadiusRatio: 0.4 },
  { file: "icon-maskable-512.png", size: 512, maxRadiusRatio: 0.3 },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const { file, size, maxRadiusRatio } of OUTPUTS) {
  const png = encodePng(size, renderIcon(size, maxRadiusRatio));
  writeFileSync(join(OUT_DIR, file), png);
  process.stdout.write(`${file} — ${size}x${size}, ${png.length} bytes\n`);
}
