export default function CatLogo({ size = 32, showText = true, subtitle = "Computer Assisted Test", light = false }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.25),
          background: light ? "#FFFFFF" : "var(--c-forest-600)",
          border: light ? "1.5px solid var(--c-sage-400)" : "1.5px solid rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: light ? "var(--c-forest-600)" : "#FFFFFF",
          boxShadow: "0 2px 6px rgba(5,31,32,0.12)"
        }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="3" />
          <path d="m8 10 3 3 5-5" />
          <path d="M12 17v4" />
          <path d="M8 21h8" />
        </svg>
      </div>

      {showText && (
        <div style={{ lineHeight: 1.15 }}>
          <div style={{
            fontSize: size * 0.58,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: light ? "#FFFFFF" : "var(--c-dark-900)"
          }}>
            CAT
          </div>
          {subtitle && (
            <div style={{
              fontSize: size * 0.32,
              fontWeight: 600,
              color: light ? "rgba(255,255,255,0.75)" : "var(--text-dim)",
              marginTop: 1
            }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
