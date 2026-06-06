import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { I18nProvider } from "./lib/i18n.tsx";
import { ThemeProvider } from "./lib/theme.tsx";
import {
  applyAffiliatePathCaseNormalize,
  applyPartnerCareSubdomainRewrite,
  applySubdomainPortalPathRewrite,
} from "./lib/portalHost";
import "./styles/index.css";

applyAffiliatePathCaseNormalize();
applyPartnerCareSubdomainRewrite();
applySubdomainPortalPathRewrite();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </ThemeProvider>
);
