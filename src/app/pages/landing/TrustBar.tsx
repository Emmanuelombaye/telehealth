import { motion } from "framer-motion";

const items = [
  "✦  Licensed Providers in All 50 States",
  "✦  Free Expedited Shipping",
  "✦  HIPAA-Compliant Platform",
  "✦  Board-Certified Physicians",
  "✦  GLP-1 Medications from $146/mo",
  "✦  Real-Time Order Tracking",
  "✦  Same-Day Provider Review",
  "✦  U.S. Licensed Compounding Pharmacies",
];

export function TrustBar() {
  const row = [...items, ...items];
  return (
    <div style={{ background:"#0d2137", overflow:"hidden", padding:"14px 0", borderBottom:"1px solid #1a3350" }}>
      <motion.div
        animate={{ x: [0, -2400] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        style={{ display:"flex", gap:"0", whiteSpace:"nowrap" }}
      >
        {row.map((t, i) => (
          <span key={i} style={{ color:"rgba(255,255,255,0.85)", fontSize:"0.78rem", fontWeight:600, padding:"0 32px", letterSpacing:"0.04em", flexShrink:0 }}>{t}</span>
        ))}
      </motion.div>
    </div>
  );
}
