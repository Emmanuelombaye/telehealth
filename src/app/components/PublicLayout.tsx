import { Suspense } from "react";
import { Outlet } from "react-router";
import { PageErrorBoundary } from "./PageErrorBoundary";
import { OsNavbar } from "./os/OsNavbar";
import { OsFooter } from "./os/OsFooter";
import { OsClinicalSyncLoader } from "./os/OsClinicalSyncLoader";

/** Public marketing shell — matches Peak Health OS (telehealth-ruby.vercel.app) */
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#0f172a] selection:bg-emerald-100 selection:text-emerald-900 font-sans animate-fade-up">
      <OsNavbar />
      <main>
        <PageErrorBoundary>
          <Suspense fallback={<OsClinicalSyncLoader />}>
            <Outlet />
          </Suspense>
        </PageErrorBoundary>
      </main>
      <OsFooter />
    </div>
  );
}
