const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function svgDataUrl(svgString) {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString.trim());
}

// Soal Stimulus Figural
const stimulusSvg = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 130" width="540" height="130" style="background:#ffffff; font-family:sans-serif;">
  <!-- Box 1 -->
  <rect x="10" y="10" width="100" height="100" rx="6" fill="none" stroke="#1e293b" stroke-width="3" />
  <circle cx="60" cy="60" r="26" fill="#1e293b" />
  
  <!-- Arrow 1 -->
  <path d="M125 60 L155 60 M145 52 L155 60 L145 68" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  
  <!-- Box 2 -->
  <rect x="170" y="10" width="100" height="100" rx="6" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4" />
  <circle cx="220" cy="60" r="42" fill="none" stroke="#1e293b" stroke-width="3" />
  <rect x="202" y="42" width="36" height="36" fill="#1e293b" />
  
  <!-- Separator :: -->
  <text x="285" y="68" font-size="32" font-weight="bold" fill="#0284c7" text-anchor="middle">:</text>
  <text x="300" y="68" font-size="32" font-weight="bold" fill="#0284c7" text-anchor="middle">:</text>
  
  <!-- Box 3 -->
  <rect x="320" y="10" width="100" height="100" rx="6" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4" />
  <polygon points="370,22 410,95 330,95" fill="none" stroke="#1e293b" stroke-width="3" stroke-linejoin="round" />
  <polygon points="370,50 385,68 370,86 355,68" fill="#1e293b" />
  
  <!-- Arrow 2 -->
  <path d="M435 60 L465 60 M455 52 L465 60 L455 68" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  
  <!-- Box 4 (?) -->
  <rect x="480" y="10" width="50" height="100" rx="6" fill="#f8fafc" stroke="#0284c7" stroke-width="2" stroke-dasharray="6" />
  <text x="505" y="70" font-size="36" font-weight="bold" fill="#0284c7" text-anchor="middle">?</text>
</svg>
`);

// Option A: Diamond outside, Triangle inside -> CORRECT
const optASvg = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" style="background:#ffffff;">
  <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="#1e293b" stroke-width="3" stroke-linejoin="round" />
  <polygon points="50,34 68,66 32,66" fill="#1e293b" />
</svg>
`);

// Option B: Circle outside, Triangle inside
const optBSvg = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" style="background:#ffffff;">
  <circle cx="50" cy="50" r="38" fill="none" stroke="#1e293b" stroke-width="3" />
  <polygon points="50,30 68,65 32,65" fill="#1e293b" />
</svg>
`);

// Option C: Diamond outside, Circle inside
const optCSvg = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" style="background:#ffffff;">
  <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="#1e293b" stroke-width="3" stroke-linejoin="round" />
  <circle cx="50" cy="50" r="16" fill="#1e293b" />
</svg>
`);

// Option D: Square outside, Diamond inside
const optDSvg = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" style="background:#ffffff;">
  <rect x="12" y="12" width="76" height="76" rx="4" fill="none" stroke="#1e293b" stroke-width="3" />
  <polygon points="50,32 68,50 50,68 32,50" fill="#1e293b" />
</svg>
`);

// Option E: Hexagon outside, Triangle inside
const optESvg = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" style="background:#ffffff;">
  <polygon points="50,12 85,32 85,68 50,88 15,68 15,32" fill="none" stroke="#1e293b" stroke-width="3" stroke-linejoin="round" />
  <polygon points="50,34 68,66 32,66" fill="#1e293b" />
</svg>
`);

const figuralSoal = {
  kategori: 'TIU',
  teks: `<p><strong>SOAL FIGURAL: ANALOGI BENTUK GEOMETRI</strong></p>
<p>Perhatikan pola perubahan bentuk pada pasangan gambar di sebelah kiri. Tentukan bentuk gambar yang paling tepat untuk menggantikan tanda tanya (<strong>?</strong>) pada pasangan di sebelah kanan:</p>
<p><img src="${stimulusSvg}" alt="Pola Soal Figural TIU" style="max-width:100%; max-height:160px; border-radius:8px; border:1.5px solid #cbd5e1; padding:8px; background:#ffffff; display:block; margin:10px 0;" /></p>`,
  opsi: [
    `<img src="${optASvg}" alt="Pilihan A" class="cat-opsi-img" />`,
    `<img src="${optBSvg}" alt="Pilihan B" class="cat-opsi-img" />`,
    `<img src="${optCSvg}" alt="Pilihan C" class="cat-opsi-img" />`,
    `<img src="${optDSvg}" alt="Pilihan D" class="cat-opsi-img" />`,
    `<img src="${optESvg}" alt="Pilihan E" class="cat-opsi-img" />`
  ],
  kunci: 0,
  bobot: null,
  aktif: true
};

async function run() {
  const { data, error } = await supabase.from('soal').insert(figuralSoal).select();
  if (error) {
    console.error('Insert error:', error.message);
  } else {
    console.log('SUKSES! Soal figural dengan gambar soal & opsi A-E berhasil ditambahkan:', data[0].id);
  }
}

run();
