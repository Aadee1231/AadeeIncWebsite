export default function WhyAIDiagram(){
  // Simple 3-step flow: Data -> AI -> Outcomes
  return (
    <section className="section">
      <div className="container card" style={{ overflow:"hidden" }}>
        <h2>Why Our AI</h2>
        <svg viewBox="0 0 800 220" style={{ width:"100%", marginTop:".75rem" }}>
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--color-primary)"/>
              <stop offset="100%" stopColor="var(--color-accent)"/>
            </linearGradient>
          </defs>
          <rect x="40"  y="60" width="180" height="100" rx="12" fill="url(#g)" opacity="0.25"/>
          <text x="130" y="118" textAnchor="middle" fill="white">Business Data</text>
          <rect x="310" y="40" width="180" height="140" rx="12" fill="url(#g)" opacity="0.35"/>
          <text x="400" y="118" textAnchor="middle" fill="white">AI Engine</text>
          <rect x="580" y="60" width="180" height="100" rx="12" fill="url(#g)" opacity="0.25"/>
          <text x="670" y="118" textAnchor="middle" fill="white">Outcomes</text>
          <path d="M220,110 L310,110" stroke="url(#g)" strokeWidth="4" />
          <path d="M490,110 L580,110" stroke="url(#g)" strokeWidth="4" />
        </svg>
        <p style={{ color:"var(--muted)" }}>
          We ingest your docs, forms, calls, and site data → our tuned AI routes, answers, and books →
          you get faster responses, more leads, and measurable ROI.
        </p>
      </div>
    </section>
  );
}
