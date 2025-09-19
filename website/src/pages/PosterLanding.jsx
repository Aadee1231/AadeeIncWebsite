

// src/pages/PosterLanding.jsx
// A vibrant, non‑AI art landing page with geometric SVG shapes, gradients, and a clean "Apple-like" layout.
// Drop this file into your React app, then add a route: <Route path="/poster" element={<PosterLanding />} />
// Replace the Google Form URL below with your real form link.

import { useMemo } from "react";

export default function PosterLanding() {
  // Generate a few random seeds so repeated visits feel alive without looking chaotic.
  const seeds = useMemo(() => (
    [
      { x: 8,  y: 10, size: 180, rotate: -12, opacity: 0.15 },
      { x: 72, y: 18, size: 220, rotate: 8,   opacity: 0.12 },
      { x: 85, y: 72, size: 160, rotate: 22,  opacity: 0.10 },
      { x: 15, y: 78, size: 140, rotate: -6,  opacity: 0.12 },
    ]
  ), []);

  return (
    <main style={styles.page}>
      {/* Animated gradient backdrop */}
      <div style={styles.gradientBG} />

      {/* Subtle grid overlay */}
      <svg aria-hidden="true" style={styles.grid} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
      </svg>

      {/* Decorative vector shapes (non‑AI, pure SVG) */}
      {seeds.map((s, i) => (
        <Blob key={i} {...s} />
      ))}

      {/* Header / hero */}
      <section style={styles.hero}>
        <div style={styles.badgesRow}>
          <Badge>🚀 Fast Turnaround</Badge>
          <Badge>🎓 Student‑Friendly</Badge>
          <Badge>💸 Affordable and Easy</Badge>
        </div>

        <h1 style={styles.title}>Your Website in a Week</h1>
        <p style={styles.subtitle}>Affordable • Custom • Built for students, clubs, & side hustles</p>

        <div style={styles.ctaRow}>
          <a href="#contact" style={{ ...styles.cta, ...styles.ctaPrimary }}>Get Started</a>
          <a href="#work" style={{ ...styles.cta, ...styles.ctaGhost }}>See What You Get</a>
        </div>
      </section>

      {/* Features / what you get */}
      <section id="work" style={styles.featuresWrap}>
        <Card>
          <IconTitle icon="💻" title="Clean, Modern Landing Page" />
          <p style={styles.cardText}>Mobile‑first, fast, and optimized for quick contact & conversions.</p>
        </Card>
        <Card>
          <IconTitle icon="🔍" title="Google / Yelp Setup" />
          <p style={styles.cardText}>Make it easy to find you: correct hours, links, and business info everywhere.</p>
        </Card>
        <Card>
          <IconTitle icon="📱" title="Social‑Ready Assets" />
          <p style={styles.cardText}>Headers, bios, and link‑in‑bio blocks that match your new brand vibe.</p>
        </Card>
      </section>

      {/* Contact panel (glassmorphism) */}
      <section id="contact" style={styles.contactSection}>
        <div style={styles.contactCard}>
          <h2 style={styles.contactTitle}>Let’s Build Yours</h2>
          <p style={styles.contactKicker}>Text or email me — or use the quick form.</p>

          <div style={styles.contactGrid}>
            <div style={styles.contactCol}>
              <InfoLine label="Text" value="704‑930‑5548" href="sms:17049305548" />
              <InfoLine label="Email" value="aadeechheda@gmail.com" href="mailto:aadeechheda@gmail.com" />
              <p style={styles.smallNote}>First 3 sign‑ups this month get <b>20% off</b> 🎉</p>
            </div>

            <div style={styles.formCol}>
              {/* Replace this Google Form URL with your real one */}
              <iframe
                title="Website Request Form"
                style={styles.iframe}
                src="https://forms.gle/7g1w8dvWYpDPfhzFA"
                width="100%"
                height="520"
              >Loading…</iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Footer chips */}
      <footer style={styles.footer}>
        <Chip>⚡ 1‑week build</Chip>
        <Chip>🧰 Hosting & domain help</Chip>
        <Chip>🧾 Simple pricing</Chip>
      </footer>

      {/* Local styles */}
      <style>{css}</style>
    </main>
  );
}

// ---------- Subcomponents ----------
function Badge({ children }) {
  return <span style={styles.badge}>{children}</span>;
}

function Card({ children }) {
  return <div style={styles.card}>{children}</div>;
}

function IconTitle({ icon, title }) {
  return (
    <div style={styles.iconTitle}>
      <span style={styles.icon}>{icon}</span>
      <h3 style={styles.cardTitle}>{title}</h3>
    </div>
  );
}

function InfoLine({ label, value, href }) {
  return (
    <div style={styles.infoLine}>
      <span style={styles.infoLabel}>{label}</span>
      {href ? (
        <a href={href} style={styles.infoValue}>{value}</a>
      ) : (
        <span style={styles.infoValue}>{value}</span>
      )}
    </div>
  );
}

function Chip({ children }) {
  return <span style={styles.chip}>{children}</span>;
}

function Blob({ x = 50, y = 50, size = 200, rotate = 0, opacity = 0.1 }) {
  const s = {
    position: "absolute",
    left: `${x}%`,
    top: `${y}%`,
    width: size,
    height: size,
    transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
    opacity,
    filter: "blur(2px)",
    pointerEvents: "none",
  };
  return (
    <svg aria-hidden="true" style={s} viewBox="0 0 200 200">
      <defs>
        <linearGradient id={`lg-${x}-${y}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4d6d" />
          <stop offset="50%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#29b6f6" />
        </linearGradient>
      </defs>
      <path
        d="M60,10 C100,-5 160,20 180,70 C200,120 170,160 120,180 C70,200 10,180 5,120 C0,70 20,25 60,10 Z"
        fill={`url(#lg-${x}-${y})`}
      />
    </svg>
  );
}

// ---------- Styles ----------
const styles = {
  page: {
    position: "relative",
    minHeight: "100svh",
    overflowX: "hidden",
    color: "#0f172a",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    backgroundColor: "#0b1020",
  },
  gradientBG: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(1200px 600px at 20% -10%, #ff6388 0%, rgba(255,99,136,0) 60%), radial-gradient(1000px 600px at 110% 10%, #5dd6ff 0%, rgba(93,214,255,0) 55%), radial-gradient(800px 400px at 50% 120%, #ffe082 0%, rgba(255,224,130,0) 60%)",
    animation: "pulse 12s ease-in-out infinite",
    zIndex: 0,
  },
  grid: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
  },
  hero: {
    position: "relative",
    zIndex: 1,
    padding: "min(7vw, 72px) 20px 24px",
    textAlign: "center",
    color: "#eef2ff",
  },
  badgesRow: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  badge: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.25)",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 14,
    backdropFilter: "blur(6px)",
  },
  title: {
    fontSize: clampPx(28, 64),
    margin: "6px auto 6px",
    lineHeight: 1.05,
    letterSpacing: -0.5,
    color: "#ffffff",
    textShadow: "0 1px 8px rgba(0,0,0,0.25)",
  },
  subtitle: {
    fontSize: clampPx(14, 20),
    color: "#e2e8f0",
    marginBottom: 18,
  },
  ctaRow: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  cta: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.25)",
    textDecoration: "none",
    fontWeight: 600,
  },
  ctaPrimary: {
    background: "#ffffff",
    color: "#0b1020",
  },
  ctaGhost: {
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
  },

  featuresWrap: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
    maxWidth: 980,
    margin: "28px auto",
    padding: "0 16px",
  },
  card: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.85))",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  },
  iconTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  icon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 18,
    margin: 0,
    color: "#0f172a",
  },
  cardText: {
    margin: 0,
    color: "#334155",
    lineHeight: 1.4,
  },

  contactSection: {
    position: "relative",
    zIndex: 1,
    margin: "36px auto 48px",
    padding: "0 16px",
    maxWidth: 1100,
  },
  contactCard: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 18,
    backdropFilter: "blur(10px)",
    padding: 20,
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
    color: "#fff",
  },
  contactTitle: {
    margin: "4px 0 8px",
    fontSize: clampPx(20, 32),
  },
  contactKicker: {
    margin: "0 0 16px",
    color: "#e2e8f0",
  },
  contactGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  },
  contactCol: {
    padding: 10,
  },
  formCol: {
    padding: 10,
  },
  iframe: {
    width: "100%",
    height: 520,
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: 12,
    background: "#fff",
  },
  infoLine: {
    display: "flex",
    gap: 8,
    alignItems: "baseline",
    margin: "0 0 8px",
  },
  infoLabel: {
    display: "inline-block",
    minWidth: 56,
    color: "#cbd5e1",
    fontSize: 14,
  },
  infoValue: {
    color: "#ffffff",
    textDecoration: "underline",
  },
  smallNote: {
    color: "#e2e8f0",
    fontSize: 14,
    marginTop: 8,
  },

  footer: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    padding: "8px 16px 28px",
  },
  chip: {
    background: "#ffffff",
    color: "#0b1020",
    borderRadius: 999,
    padding: "8px 12px",
    border: "1px solid rgba(0,0,0,0.08)",
    fontSize: 14,
    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
  },
};

function clampPx(minPx, maxPx) {
  return `clamp(${minPx}px, 2.5vw + ${minPx/3}px, ${maxPx}px)`;
}

const css = `
@keyframes pulse {
  0%, 100% { filter: saturate(1) brightness(1); }
  50% { filter: saturate(1.2) brightness(1.06); }
}

/* Responsive tweaks */
@media (min-width: 860px) {
  #contact .grid { grid-template-columns: 1fr 1fr; }
}
`;

