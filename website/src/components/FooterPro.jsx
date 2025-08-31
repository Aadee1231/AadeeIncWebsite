export default function FooterPro(){
  const year = new Date().getFullYear();
  return (
    <footer style={{ background:"#0b0e19", borderTop:"1px solid rgba(255,255,255,.08)", marginTop:40 }}>
      <div className="container" style={{ padding:"40px 0" }}>
        <div className="grid" style={{ gridTemplateColumns:"repeat(6,1fr)", gap:"1.25rem" }}>
          <div>
            <h4>Solutions</h4>
            <ul>
              <li><a href="/services">Virtual Receptionists</a></li>
              <li><a href="/services">AI Receptionist</a></li>
              <li><a href="/pricing">Plans & Pricing</a></li>
              <li><a href="/about">How it works</a></li>
            </ul>
          </div>
          <div>
            <h4>Features</h4>
            <ul>
              <li>Lead capture</li>
              <li>Appointment booking</li>
              <li>Call & chat transcripts</li>
              <li>Analytics dashboard</li>
            </ul>
          </div>
          <div>
            <h4>Industries</h4>
            <ul>
              <li>Healthcare</li>
              <li>Restaurants</li>
              <li>Retail</li>
              <li>Home Services</li>
            </ul>
          </div>
          <div>
            <h4>For Business</h4>
            <ul>
              <li>Solo & Small business</li>
              <li>Mid-market</li>
              <li>Enterprise</li>
              <li>Agencies</li>
            </ul>
          </div>
          <div>
            <h4>Resources</h4>
            <ul>
              <li>Blog & news</li>
              <li>Case studies</li>
              <li>Support</li>
              <li>Developer API</li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact us</a></li>
              <li>Careers</li>
              <li>Press</li>
            </ul>
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:24, color:"var(--muted)" }}>
          <div>© {year} Aadee Inc.</div>
          <div style={{ display:"flex", gap:"12px" }}>
            <a href="#">X</a><a href="#">LinkedIn</a><a href="#">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
