import site from "../content/site.json";
import Reveal from "./Reveal";

export default function Stats(){
  const stats = site.home.stats || [];
  return (
    <section className="section">
      <div className="container">
        <div className="grid grid-3 gap-lg equal-3">
          {stats.map((s,i)=> (
            <Reveal key={i} delay={i*0.08}>
              <div className="card glow" style={{ textAlign:"center" }}>
                <div className="text-gradient" style={{ fontSize:"2rem", fontWeight:700 }}>{s.value}</div>
                <div style={{ color:"var(--muted)" }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
