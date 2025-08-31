import AnimatedHero from "../components/AnimatedHero";
import IndustryGrid from "../components/IndustryGrid";
import WhyUs from "../components/WhyUs";
import Stats from "../components/Stats";
import Reveal from "../components/Reveal";
import site from "../content/site.json";

export default function Home(){
  const h = site.home;
  return (
    <main>
      <AnimatedHero />

      {/* Advantages & why AI */}
      <section className="section">
        <div className="container">
          <h2>Advantages & Why AI</h2>
          <div className="grid grid-3" style={{marginTop:"1rem"}}>
            {h.advantages.map((a,i)=> (
              <Reveal key={a.title} delay={i*0.06}>
                <div className="card glow" style={{padding:"1rem"}}>
                  <h3>{a.title}</h3>
                  <p style={{color:"var(--muted)"}}>{a.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <IndustryGrid />
      <Stats />
      <WhyUs />

      {/* Contact CTA */}
      <section className="section">
        <div className="container card glow">
          <h2>Let's talk</h2>
          <p style={{color:"var(--muted)"}}>{h.contactBlurb}</p>
          <a className="btn neon" href="/contact">Contact us</a>
        </div>
      </section>
    </main>
  );
}
