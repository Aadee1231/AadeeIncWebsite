import { useState } from "react";
import site from "../content/site.json";
import Accordion from "../components/Accordion";
import Reveal from "../components/Reveal";

export default function Services(){
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <main>
      <section className="section services-page">
        <div className="container">
          <h1>Services</h1>
          <div className="grid mt-2">
            {site.services.map((s, i)=> (
              <Reveal key={s.title} delay={i*0.06}>
                <Accordion
                  title={s.title}
                  open={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                >
                  {/* You can keep both, or just details */}
                  {s.summary && <p style={{color:"var(--muted)"}}>{s.summary}</p>}
                  <p style={{color:"var(--muted)"}}>{s.details}</p>
                </Accordion>
              </Reveal>
            ))}
          </div>

          {/* Leave the Contact card size as-is (no page-level scaling styles will touch it) */}
          <div className="card mt-2">
            <h3>Contact</h3>
            <p style={{color:"var(--muted)"}}>
              Email: {site.contact.email} • Phone: {site.contact.phone}
            </p>
            <a className="btn" href="/contact">Inquire now</a>
          </div>
        </div>
      </section>
    </main>
  );
}
