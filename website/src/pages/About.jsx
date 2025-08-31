import site from "../content/site.json";
import Reveal from "../components/Reveal";

export default function About(){
  const a = site.about;
  return (
    <main>
      {/* Hero image with subtle ambient accents */}
      <section className="section ribbon about-accents" style={{paddingTop:0}}>
        <div className="container">
          <img src={a.heroImage} alt="About Aadee Inc." style={{ width:"100%", borderRadius:12 }}/>
        </div>
      </section>

      {/* What We Do (already using band) */}
      <section className="section band">
        <div className="container">
          <h2>What We Do</h2>
          <p style={{ color:"var(--muted)", fontSize:"1.15rem", lineHeight:1.7, maxWidth:900 }}>
            {a.whatWeDo}
          </p>
        </div>
      </section>

      {/* Our Team — now with band */}
      <section className="section">
        <div className="container">
          <h2>Our Team</h2>
          <div className="grid grid-3 gap-lg mt-2">
            {a.team.map((t)=> (
              <Reveal key={t.name}>
                <div className="card">
                  <h3>{t.name}</h3>
                  <p style={{color:"var(--muted)"}}>{t.role}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story — now with band */}
      <section className="section band">
        <div className="container">
            <h2>Our Story</h2>
            <p style={{color:"var(--muted)", fontSize:"1.05rem", lineHeight:1.7, maxWidth:900}}>
            {a.story}
            </p>
        </div>
      </section>
    </main>
  );
}
