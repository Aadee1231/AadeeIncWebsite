// PosterLanding.jsx
export default function PosterLanding() {
  return (
    <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center", padding: "20px" }}>
      <h1>🚀 Let’s Build Your Website</h1>
      <p style={{ fontSize: "1.2em", color: "#555" }}>
        Affordable • Custom • Student-friendly
      </p>
      <p>📱 Text me: <b>704-930-5548</b></p>
      <p>✉️ Email: <b>aadeechheda@gmail.com</b></p>
      <p>👉 Or just fill out this quick form:</p>

      <iframe
        src="https://forms.gle/7g1w8dvWYpDPfhzFA"
        width="100%"
        height="500"
        style={{ border: "1px solid #ccc", borderRadius: 8 }}
        title="Contact Form"
      ></iframe>
    </div>
  );
}
