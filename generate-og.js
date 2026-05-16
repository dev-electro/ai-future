const fs = require('fs');
const sharp = require('sharp');
const pub = '/Users/gauravsuthar/Projects/AI Exposure Index/public';

const ogTextSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b162c" />
      <stop offset="50%" stop-color="#050810" />
      <stop offset="100%" stop-color="#0a0818" />
    </linearGradient>
    <linearGradient id="red" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#991b1b" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  
  <g stroke="#1e293b" stroke-width="1" opacity="0.5">
    ${Array.from({ length: 20 }).map((_, i) => `<line x1="0" y1="${i * 40}" x2="1200" y2="${i * 40}" />\n<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="630" />`).join('')}
  </g>

  <rect x="100" y="150" width="1000" height="330" rx="24" fill="#0f172a" stroke="#334155" stroke-width="2" />

  <circle cx="280" cy="315" r="100" fill="none" stroke="#1e293b" stroke-width="20" />
  <path d="M 180 315 A 100 100 0 1 1 366 365" fill="none" stroke="url(#red)" stroke-width="20" stroke-linecap="round" />
  <text x="280" y="345" font-family="monospace, Arial" font-size="90" font-weight="900" fill="#ef4444" text-anchor="middle">92</text>
  
  <text x="440" y="260" font-family="serif, Arial" font-size="56" font-weight="800" fill="#ffffff">Computer Programmer</text>
  <text x="440" y="330" font-family="sans-serif, Arial" font-size="36" font-weight="600" fill="#ef4444">CRITICAL AI RISK</text>
  <text x="440" y="410" font-family="sans-serif, Arial" font-size="24" font-weight="400" fill="#94a3b8">Based on Anthropic 2026 Labor Market Research</text>

  <text x="100" y="80" font-family="serif, Arial" font-size="32" font-weight="800" fill="#e2e8f0" letter-spacing="-1">AI Future</text>
</svg>`;

fs.writeFileSync(pub + '/og-text-source.svg', ogTextSvg);

sharp(pub + '/og-text-source.svg')
    .resize(1200, 630)
    .png()
    .toFile(pub + '/og-image.png')
    .then(() => console.log('Dynamic OG image created successfully'))
    .catch(console.error);
