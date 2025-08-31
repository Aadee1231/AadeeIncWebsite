import site from "../content/site.json";
import Reveal from "./Reveal";

export default function IndustryGrid(){
  const list = site.home.industries || [];
  return (
    <section className="section">
      <div className="container">
        <h2>Industries We Work With</h2>
        <div className="grid grid-3 gap-lg mt-2">
          {list.map((it, i) => (
            <Reveal key={it.name} delay={i*0.06}>
              <div className="card img-card">{/* no glow here */}
                <img src={it.img} alt={it.name} />
                <h3 style={{ marginTop:".5rem" }}>{it.name}</h3>
                <p className="img-caption">{it.example}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
