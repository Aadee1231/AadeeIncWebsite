import site from "../content/site.json";

export default function LogoMarquee(){
  const logos = site.home.logos || [];
  if(!logos.length) return null;
  return (
    <div style={{ overflow:"hidden", borderTop:"1px solid rgba(255,255,255,.08)", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
      <div style={{
        display:"flex", gap:"40px", alignItems:"center",
        animation:"scroll 18s linear infinite", padding:"14px 0"
      }}>
        {logos.concat(logos).map((src, i) => (
          <img key={i} src={src} alt="" style={{ height:24, opacity:.7 }} />
        ))}
      </div>
      <style>{`@keyframes scroll {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}
