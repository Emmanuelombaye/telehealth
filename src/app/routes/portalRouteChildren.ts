import type { RouteObject } from "react-router";
import { lazy } from "react";
import { lazyRetry } from "../../lib/lazyRetry";

const AdminDashboard = lazy(() =>
  lazyRetry(() => import("../pages/admin/Dashboard").then((m) => ({ default: m.AdminDashboard }))),
);
const AdminPatientsPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Patients").then((m) => ({ default: m.AdminPatientsPage }))),
);
const AdminTreatmentsPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Treatments").then((m) => ({ default: m.AdminTreatmentsPage }))),
);
const AdminOrdersPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Orders").then((m) => ({ default: m.AdminOrdersPage }))),
);
const AdminMessagesPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Messages").then((m) => ({ default: m.AdminMessagesPage }))),
);
const AdminAnalyticsPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Analytics").then((m) => ({ default: m.AdminAnalyticsPage }))),
);
const AdminToolsPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Tools").then((m) => ({ default: m.AdminToolsPage }))),
);
const AdminQuestionnairePage = lazy(() =>
  lazyRetry(() =>
    import("../pages/admin/pages/Questionnaire").then((m) => ({ default: m.AdminQuestionnairePage })),
  ),
);
const AdminProductsPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Products").then((m) => ({ default: m.AdminProductsPage }))),
);
const AdminBuildersPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Builders").then((m) => ({ default: m.AdminBuildersPage }))),
);
const AdminFinancePage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Finance").then((m) => ({ default: m.AdminFinancePage }))),
);
const AdminDiscountsPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Discounts").then((m) => ({ default: m.AdminDiscountsPage }))),
);
const AdminAffiliatesPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Affiliates").then((m) => ({ default: m.AdminAffiliatesPage }))),
);
const AdminUsersPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Users").then((m) => ({ default: m.AdminUsersPage }))),
);
const AdminAuditPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Audit").then((m) => ({ default: m.AdminAuditPage }))),
);
const AdminSettingsPage = lazy(() =>
  lazyRetry(() => import("../pages/admin/pages/Settings").then((m) => ({ default: m.AdminSettingsPage }))),
);
const DoctorNotificationsPage = lazy(() =>
  lazyRetry(() =>
    import("../pages/doctor/pages/Notifications").then((m) => ({ default: m.DoctorNotificationsPage })),
  ),
);
const AffiliateDashboard = lazy(() =>
  lazyRetry(() =>
    import("../pages/affiliate/AffiliateDashboard").then((m) => ({
      default: m.AffiliateDashboard,
    })),
  ),
);

/** Shared admin portal pages — used at /admin/* and /care/:brandSlug/admin/* */
export const adminPortalChildRoutes: RouteObject[] = [
  { index: true, Component: AdminDashboard },
  { path: "patients", Component: AdminPatientsPage },
  { path: "treatments", Component: AdminTreatmentsPage },
  { path: "orders", Component: AdminOrdersPage },
  { path: "messages", Component: AdminMessagesPage },
  { path: "analytics", Component: AdminAnalyticsPage },
  { path: "tools", Component: AdminToolsPage },
  { path: "questionnaires", Component: AdminQuestionnairePage },
  { path: "products", Component: AdminProductsPage },
  { path: "builders", Component: AdminBuildersPage },
  { path: "finance", Component: AdminFinancePage },
  { path: "discounts", Component: AdminDiscountsPage },
  { path: "affiliates", Component: AdminAffiliatesPage },
  { path: "users", Component: AdminUsersPage },
  { path: "audit", Component: AdminAuditPage },
  { path: "settings", Component: AdminSettingsPage },
  { path: "notifications", Component: DoctorNotificationsPage },
];

/** Shared affiliate portal pages — used at /affiliate/* and /care/:brandSlug/affiliate/* */
export const affiliatePortalChildRoutes: RouteObject[] = [
  { index: true, Component: AffiliateDashboard },
  { path: "referrals", Component: AffiliateDashboard },
  { path: "payouts", Component: AffiliateDashboard },
  { path: "assets", Component: AffiliateDashboard },
  { path: "settings", Component: AffiliateDashboard },
];
