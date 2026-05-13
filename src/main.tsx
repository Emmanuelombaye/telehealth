import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { I18nProvider } from "./lib/i18n.tsx";
import { ThemeProvider } from "./lib/theme.tsx";
import "./styles/index.css";

// Subdomain portal routing: admin.domain → /admin, doctor.domain → /doctor, etc.
const subdomain = window.location.hostname.split('.')[0];
const portalMap: Record<string, string> = {
  admin: '/admin',
  superadmin: '/superadmin',
  doctor: '/doctor',
  patient: '/patient',
};
if (portalMap[subdomain] && window.location.pathname === '/') {
  window.history.replaceState(null, '', portalMap[subdomain]);
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </ThemeProvider>
);
