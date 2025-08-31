import Reveal from "./Reveal";

export default function WhyUs(){
  return (
    <section className="section">
      <div className="container">
        <h2>Why Us</h2>
        <p style={{color:"var(--muted)", maxWidth:720}}>
          Everything in one easy place. We respond fast, work 1-on-1 with you, and build on the latest AI tech.
        </p>

        {/* BIG diagram card has glow */}
        <div className="card glow mt-2" style={{ overflow:"hidden" }}>
          <svg viewBox="0 0 860 360" style={{width:"100%"}}>
            <defs>
              <linearGradient id="wug" x1="0" x2="1">
                <stop offset="0%"  stopColor="var(--color-primary)"/>
                <stop offset="100%" stopColor="var(--color-accent)"/>
              </linearGradient>
            </defs>

            {/*
              Node layout (all 44px tall):
              - Left  : x=130 width=170  (y=70, y=228)
              - Right : x=560 width=170  (y=70, y=228)
              - Top   : x=345 width=220  (y=20)   -> "Create Your Own Business"
              - Bottom: x=300 width=300  (y=296)  -> "Grow Sales Exponentially"
              Lines terminate at the nearest edge/center of each node – no overlap with text.
            */}

            {/* 1) Lines FIRST so elements drawn later (badge/text) sit on top */}
            {/* Left-top (to right edge center of its rect) */}
            <path d="M430 170 L300 92" stroke="url(#wug)" strokeWidth="3" strokeLinecap="round"/>
            {/* Left-bottom */}
            <path d="M430 170 L300 250" stroke="url(#wug)" strokeWidth="3" strokeLinecap="round"/>
            {/* Right-top (to left edge center) */}
            <path d="M430 170 L560 92" stroke="url(#wug)" strokeWidth="3" strokeLinecap="round"/>
            {/* Right-bottom */}
            <path d="M430 170 L560 250" stroke="url(#wug)" strokeWidth="3" strokeLinecap="round"/>
            {/* Top (to bottom edge center of top rect) */}
            <path d="M430 170 L455 64" stroke="url(#wug)" strokeWidth="3" strokeLinecap="round"/>
            {/* Bottom (to top edge center of bottom rect) */}
            <path d="M430 170 L450 296" stroke="url(#wug)" strokeWidth="3" strokeLinecap="round"/>

            {/* 2) Center badge AFTER lines so it's on top */}
            <circle cx="430" cy="170" r="56" fill="url(#wug)" opacity="0.35"/>
            {/* Little dark disc behind text for contrast */}
            <circle cx="430" cy="170" r="22" fill="rgba(15,18,32,.85)"/>
            <text x="430" y="175" textAnchor="middle" fill="white" fontWeight="700">
              Unified AI Hub
            </text>

            {/* 3) Outer nodes */}
            {/* Left top */}
            <rect x="130" y="70" width="170" height="44" rx="10" ry="10"
                  fill="rgba(255,255,255,.08)" stroke="url(#wug)"/>
            <text x="215" y="97" textAnchor="middle" fill="white">Fast Responses</text>

            {/* Left bottom */}
            <rect x="130" y="228" width="170" height="44" rx="10" ry="10"
                  fill="rgba(255,255,255,.08)" stroke="url(#wug)"/>
            <text x="215" y="255" textAnchor="middle" fill="white">1-on-1 Service</text>

            {/* Right top */}
            <rect x="560" y="70" width="170" height="44" rx="10" ry="10"
                  fill="rgba(255,255,255,.08)" stroke="url(#wug)"/>
            <text x="645" y="97" textAnchor="middle" fill="white">Advanced AI</text>

            {/* Right bottom */}
            <rect x="560" y="228" width="170" height="44" rx="10" ry="10"
                  fill="rgba(255,255,255,.08)" stroke="url(#wug)"/>
            <text x="645" y="255" textAnchor="middle" fill="white">Latest Tech</text>

            {/* Top center: Create Your Own Business (line connects to its bottom edge center at 455,64) */}
            <rect x="345" y="20" width="220" height="44" rx="10" ry="10"
                  fill="rgba(255,255,255,.08)" stroke="url(#wug)"/>
            <text x="455" y="48" textAnchor="middle" fill="white">Create Your Own Business</text>

            {/* Bottom center: Grow Sales Exponentially (line connects to its top edge center at 450,296) */}
            <rect x="300" y="296" width="300" height="44" rx="10" ry="10"
                  fill="rgba(255,255,255,.08)" stroke="url(#wug)"/>
            <text x="450" y="324" textAnchor="middle" fill="white">Grow Sales Exponentially</text>
          </svg>

          {/* Three equal-height points below — NO glow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 grid-equal-rows">
            <Reveal>
                <div className="card flex flex-col h-full">
                <h3>All-in-one</h3>
                <p style={{color:"var(--muted)"}}>
                    Website, chatbot, receptionist, SEO—no juggling tools.
                </p>
                </div>
            </Reveal>
            <Reveal delay={.06}>
                <div className="card flex flex-col h-full">
                <h3>Fast & personal</h3>
                <p style={{color:"var(--muted)"}}>
                    Real humans, quick replies, clear outcomes.
                </p>
                </div>
            </Reveal>
            <Reveal delay={.12}>
                <div className="card flex flex-col h-full">
                <h3>Cutting-edge</h3>
                <p style={{color:"var(--muted)"}}>
                    We adopt the latest models & best practices as they land.
                </p>
                </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
