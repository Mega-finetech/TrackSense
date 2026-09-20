const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

sizes.forEach(size => {
  const r = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.35);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" rx="${r}" fill="#0A1628"/>`,
    `<text x="50%" y="52%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#00B4D8" text-anchor="middle" dominant-baseline="middle">TS</text>`,
    `</svg>`
  ].join('');
  fs.writeFileSync(path.join(outDir, `icon-${size}.svg`), svg);
  console.log(`Created icon-${size}.svg`);
});

// Maskable variant (full bleed, no rounded corners)
const maskable = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">`,
  `<rect width="512" height="512" fill="#0A1628"/>`,
  `<circle cx="256" cy="256" r="220" fill="#0D2A4A"/>`,
  `<text x="50%" y="52%" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="#00B4D8" text-anchor="middle" dominant-baseline="middle">TS</text>`,
  `</svg>`
].join('');
fs.writeFileSync(path.join(outDir, 'icon-512-maskable.svg'), maskable);
console.log('Created icon-512-maskable.svg');
console.log('All icons generated!');
