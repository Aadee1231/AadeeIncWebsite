import site from "../content/site.json";

export default function Pricing(){
  return (
    <main>
      <section className="section ai-gradient">
        <div className="container">
          <h1>Pricing</h1>
          <p style={{color:"var(--muted)", maxWidth:560}}>Transparent plans. Upgrade anytime.</p>
          <div className="grid grid-3 gap-lg mt-2">
            {site.pricing.map((p)=> (
              <div key={p.plan} className="glass card lift glow" style={{ padding:"1rem" }}>
                <h3>{p.plan}</h3>
                <p><strong>{p.price}</strong></p>
                <ul style={{color:"var(--muted)", paddingLeft:"1.25rem"}}>
                  {p.includes.map((i)=>(<li key={i}>{i}</li>))}
                </ul>
                <a className="btn" href="/contact" style={{marginTop:".75rem", display:"inline-block"}}>Get started</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container card glow">
          <h2>Need a custom plan?</h2>
          <a className="btn" href="/contact">Talk to us</a>
        </div>
      </section>
    </main>
  );
}
