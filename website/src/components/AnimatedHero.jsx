import { motion } from "framer-motion";
import site from "../content/site.json";
import Reveal from "./Reveal";

export default function AnimatedHero(){
  const h = site.home.hero;
  return (
    <section className="section ribbon" style={{ position:"relative" }}>
      {/* Optional looping video for wow-factor */}
      {site.media?.heroVideo && (
        <video autoPlay muted loop playsInline
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.15 }}>
          <source src={site.media.heroVideo} type="video/webm" />
        </video>
      )}

      <div className="container" style={{ position:"relative", display:"grid", gap:"1rem", gridTemplateColumns:"1.1fr .9fr", alignItems:"center" }}>
        <div>
          <motion.h1 className="text-gradient" style={{fontSize:"2.35rem"}} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
            {h.headline}
          </motion.h1>
          <Reveal><p style={{color:"var(--muted)", maxWidth:660, fontSize:"1.08rem"}}>{h.subhead}</p></Reveal>
          <div className="pills">
            <span className="pill">Lightning-fast</span>
            <span className="pill">1-on-1 onboarding</span>
            <span className="pill">Latest AI models</span>
            <span className="pill">All-in-one</span>
          </div>
          <Reveal delay={.15}><a className="btn neon" href={h.cta.to} style={{marginTop:"1rem", display:"inline-block"}}>{h.cta.label}</a></Reveal>
        </div>

        <motion.img
          src={h.media}
          alt="AI hero"
          style={{ width:"100%", borderRadius:12 }}
          initial={{opacity:0, scale:.96}} animate={{opacity:1, scale:1}} transition={{duration:.7}}
        />
      </div>

      {/* Floating ambient orbs */}
      <motion.div style={{position:"absolute", top:40, right:80, width:80, height:80, borderRadius:"50%", background:"var(--color-accent)", filter:"blur(12px)", opacity:.35}}
        animate={{ y:[0, -10, 0] }} transition={{ duration:6, repeat:Infinity }} />
      <motion.div style={{position:"absolute", bottom:40, left:60, width:120, height:120, borderRadius:"50%", background:"var(--color-primary)", filter:"blur(18px)", opacity:.25}}
        animate={{ y:[0, 12, 0] }} transition={{ duration:7, repeat:Infinity }} />

      {/* Sparkles */}
      {[...Array(8)].map((_,i)=>(
        <div key={i} className="sparkle"
             style={{ width:6,height:6, left: `${10+ i*10}%`, top: `${30 + (i%3)*12}%`, animation:`drift ${5+i}s ease-in-out infinite` }} />
      ))}
    </section>
  );
}
