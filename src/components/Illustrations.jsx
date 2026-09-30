export function StudentExamIllustration({ width = "100%", height = 240 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background soft bubble */}
      <ellipse cx="210" cy="180" rx="190" ry="85" fill="#DAF1DE" opacity="0.75" />
      <circle cx="90" cy="80" r="45" fill="#8EB69B" opacity="0.25" />

      {/* Desk and Plant on Left */}
      <path d="M40 230 C40 210 50 170 65 155 C70 175 60 210 40 230 Z" fill="#235347" />
      <path d="M55 230 C55 200 70 160 85 145 C90 170 75 210 55 230 Z" fill="#8EB69B" />
      <path d="M30 230 C30 215 35 190 48 180 C50 195 42 220 30 230 Z" fill="#163832" />
      {/* Pot */}
      <rect x="35" y="225" width="45" height="35" rx="6" fill="#DAF1DE" stroke="#235347" strokeWidth="2.5" />

      {/* Floating Checkmark cards */}
      <g transform="translate(140, 60)">
        <rect x="0" y="0" width="85" height="50" rx="10" fill="#FFFFFF" stroke="#8EB69B" strokeWidth="2" filter="drop-shadow(0 4px 10px rgba(5,31,32,0.06))" />
        <circle cx="20" cy="20" r="8" fill="#DAF1DE" />
        <path d="M16 20 L19 23 L25 17" stroke="#235347" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="34" y="16" width="38" height="6" rx="3" fill="#8EB69B" />
        <circle cx="20" cy="35" r="8" fill="#DAF1DE" />
        <path d="M16 35 L19 38 L25 32" stroke="#235347" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="34" y="32" width="28" height="6" rx="3" fill="#8EB69B" />
      </g>

      {/* Floating Clock */}
      <g transform="translate(245, 65)">
        <circle cx="24" cy="24" r="22" fill="#FFFFFF" stroke="#235347" strokeWidth="2.5" />
        <circle cx="24" cy="24" r="2.5" fill="#235347" />
        <path d="M24 12 V24 L31 28" stroke="#235347" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="18" stroke="#8EB69B" strokeWidth="1" strokeDasharray="2 3" />
      </g>

      {/* Person Sitting at Laptop */}
      {/* Chair Back */}
      <rect x="120" y="170" width="22" height="70" rx="8" fill="#163832" />
      
      {/* Body / Hoodie */}
      <path d="M135 255 C135 205 160 185 195 185 C230 185 250 205 250 255 Z" fill="#235347" />
      
      {/* Arms to laptop */}
      <path d="M160 215 Q195 240 235 220" stroke="#163832" strokeWidth="16" strokeLinecap="round" />

      {/* Neck & Head */}
      <rect x="186" y="165" width="16" height="24" fill="#F4D0B5" rx="5" />
      {/* Face */}
      <ellipse cx="194" cy="148" rx="20" ry="24" fill="#F4D0B5" />
      {/* Hair */}
      <path d="M174 148 C174 125 182 120 200 120 C218 120 218 135 218 145 C215 142 208 140 200 142 C192 144 185 142 174 148 Z" fill="#051F20" />
      <path d="M174 145 C170 140 172 130 180 128" stroke="#051F20" strokeWidth="4" strokeLinecap="round" />
      {/* Facial Features */}
      <ellipse cx="203" cy="148" rx="2.5" ry="3.5" fill="#051F20" />
      <path d="M200 156 Q204 160 208 156" stroke="#C97A10" strokeWidth="2" strokeLinecap="round" />

      {/* Laptop on table */}
      {/* Laptop Base */}
      <rect x="220" y="222" width="70" height="7" rx="3.5" fill="#0B2B26" />
      {/* Laptop Screen */}
      <path d="M235 175 L285 175 L278 222 L228 222 Z" fill="#163832" />
      <path d="M238 178 L282 178 L276 219 L232 219 Z" fill="#DAF1DE" />
      {/* Glowing Screen logo */}
      <circle cx="256" cy="198" r="4.5" fill="#235347" />

      {/* Table Desk line */}
      <rect x="30" y="248" width="360" height="8" rx="4" fill="#C4D7CB" />
      <rect x="60" y="256" width="14" height="24" rx="2" fill="#8EB69B" />
      <rect x="345" y="256" width="14" height="24" rx="2" fill="#8EB69B" />
    </svg>
  );
}

export function AdminBadgeIllustration({ width = 110, height = 75 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 140 95" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="70" cy="65" rx="55" ry="24" fill="#DAF1DE" />
      {/* Small laptop */}
      <rect x="42" y="44" width="56" height="5" rx="2.5" fill="#0B2B26" />
      <path d="M48 20 L92 20 L87 44 L43 44 Z" fill="#235347" />
      <path d="M51 23 L89 23 L85 41 L47 41 Z" fill="#F4F8F5" />
      {/* Admin avatar mini */}
      <circle cx="70" cy="16" r="11" fill="#051F20" />
      <ellipse cx="70" cy="19" rx="8" ry="9" fill="#F4D0B5" />
      <path d="M62 16 C63 10 77 10 78 16 Z" fill="#051F20" />
      {/* Floating shield check */}
      <circle cx="104" cy="22" r="14" fill="#8EB69B" />
      <path d="M99 22 L103 26 L110 19" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
