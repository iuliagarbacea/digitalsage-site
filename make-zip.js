// Împachetează site/ într-un zip cu căi cu „/”, cum cere Cloudflare Pages la upload (copiat din host-kit).
// Motiv: Compress-Archive din PowerShell 5.1 scrie „app\app.js”; Pages a creat pe 24.09.2026 un fișier
// numit literal „app\app.js” la rădăcină, iar /app/ și /ghid/ au rămas vechi. Fără dependențe.
//   node make-zip.js [nume.zip]     (implicit: digitalsage-site-AAAA-LL-ZZ.zip în website/)
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = __dirname, SRC = path.join(ROOT, "site");
const d = new Date(), pad = n => String(n).padStart(2, '0');
const OUT = path.resolve(ROOT, process.argv[2] || `digitalsage-site-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.zip`);

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = buf => { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const dosTime = t => ((t.getHours() << 11) | (t.getMinutes() << 5) | (t.getSeconds() >> 1)) & 0xFFFF;
const dosDate = t => (((t.getFullYear() - 1980) << 9) | ((t.getMonth() + 1) << 5) | t.getDate()) & 0xFFFF;

const files = [];
(function walk(dir, rel) {
  for (const f of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, f), r = rel ? rel + '/' + f : f;
    if (fs.statSync(p).isDirectory()) walk(p, r); else if (f !== '.DS_Store' && f !== 'Thumbs.db') files.push([p, r]);
  }
})(SRC, '');

const parts = [], central = []; let offset = 0;
for (const [p, name] of files) {
  const data = fs.readFileSync(p), st = fs.statSync(p), nameB = Buffer.from(name, 'utf8');
  const comp = zlib.deflateRawSync(data, { level: 9 });
  const method = comp.length < data.length ? 8 : 0, body = method ? comp : data;
  const crc = crc32(data), tm = dosTime(st.mtime), dt = dosDate(st.mtime);
  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(method, 8);
  lh.writeUInt16LE(tm, 10); lh.writeUInt16LE(dt, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(data.length, 22);
  lh.writeUInt16LE(nameB.length, 26); lh.writeUInt16LE(0, 28);
  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(method, 10);
  ch.writeUInt16LE(tm, 12); ch.writeUInt16LE(dt, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(data.length, 24);
  ch.writeUInt16LE(nameB.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42);
  parts.push(lh, nameB, body); central.push(ch, nameB);
  offset += lh.length + nameB.length + body.length;
}
const cd = Buffer.concat(central), eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6); eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10);
eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16); eocd.writeUInt16LE(0, 20);
fs.writeFileSync(OUT, Buffer.concat([...parts, cd, eocd]));
console.log(`${path.basename(OUT)}: ${files.length} fișiere, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB, căi cu „/”`);
