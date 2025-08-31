import site from "../content/site.json";
export default function Footer(){
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">© {year} {site.brand.name}. All rights reserved.</div>
    </footer>
  );
}
