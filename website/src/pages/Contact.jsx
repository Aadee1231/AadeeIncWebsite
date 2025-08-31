import { useState } from "react";
import site from "../content/site.json";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function Contact(){
  const [form, setForm] = useState({ name:"", email:"", message:"" });
  const [hire, setHire] = useState({ name:"", email:"", role:"", resume:"" });
  const [msg, setMsg] = useState("");

  async function submit(e){
    e.preventDefault(); setMsg("");
    try{
      const res = await fetch(`${API_BASE}/contact`, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(form)
      });
      if(!res.ok) throw new Error();
      setMsg("Thanks! We'll reply ASAP.");
      setForm({ name:"", email:"", message:"" });
    }catch{ setMsg("Something went wrong."); }
  }

  const inputStyle = { fontSize:"1.05rem", padding:".65rem .75rem", borderRadius:10, border:"1px solid rgba(255,255,255,.12)", background:"rgba(255,255,255,.05)", color:"var(--text)" };

  return (
    <main>
      <section className="section page-accents">
        <div className="container">
          <h1>Contact</h1>

          {/* Inquire Form */}
          <form onSubmit={submit} className="card" style={{display:"grid", gap:"1rem", maxWidth:640, fontSize:"1.05rem"}}>
            <input style={inputStyle} placeholder="Your name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
            <input style={inputStyle} placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
            <textarea style={{...inputStyle, minHeight:140}} placeholder="Tell us what you need" value={form.message} onChange={e=>setForm({...form, message:e.target.value})} required />
            <button className="btn" style={{fontSize:"1.05rem"}}>Send</button>
            {msg && <p style={{color:"var(--muted)"}}>{msg}</p>}
          </form>

          {/* Our Email / Phone / Social */}
          <div className="card mt-3" style={{fontSize:"1.05rem"}}>
            <h3>Reach us</h3>
            <p style={{color:"var(--muted)"}}>
              Email: {site.contact.email}<br/>
              Phone: {site.contact.phone}<br/>
              <span style={{color:"var(--text)"}}>
                <a href={site.contact.social.linkedin}>LinkedIn</a> • <a href={site.contact.social.x}>X/Twitter</a>
              </span>
            </p>
          </div>

          {/* Hiring Form (optional demo) */}
          {site.contact.hiring?.enabled && (
            <div className="card mt-3" style={{fontSize:"1.05rem"}}>
              <h3>Hiring</h3>
              <p style={{color:"var(--muted)"}}>{site.contact.hiring.text}</p>
              <div style={{display:"grid", gap:"1rem", maxWidth:640}}>
                <input style={inputStyle} placeholder="Your name" value={hire.name} onChange={e=>setHire({...hire, name:e.target.value})} />
                <input style={inputStyle} placeholder="Email" value={hire.email} onChange={e=>setHire({...hire, email:e.target.value})} />
                <input style={inputStyle} placeholder="Role of interest" value={hire.role} onChange={e=>setHire({...hire, role:e.target.value})} />
                <input style={inputStyle} placeholder="Resume link (optional)" value={hire.resume} onChange={e=>setHire({...hire, resume:e.target.value})} />
                <button className="btn" type="button" onClick={()=>alert("Submitted (demo)")} style={{fontSize:"1.05rem"}}>Submit</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
