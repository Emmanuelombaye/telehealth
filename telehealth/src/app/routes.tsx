import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { LandingPage } from "./pages/Landing";
import { PatientDashboard } from "./pages/patient/Dashboard";
import { DoctorDashboard } from "./pages/doctor/Dashboard";
import { AdminDashboard } from "./pages/admin/Dashboard";

// Patient pages
import { AppointmentsPage } from "./pages/patient/pages/Appointments";
import { IntakeFormsPage } from "./pages/patient/pages/IntakeForms";
import { VisitFormsPage } from "./pages/patient/pages/VisitForms";
import { MessagesPage } from "./pages/patient/pages/Messages";
import { VisitSummariesPage } from "./pages/patient/pages/VisitSummaries";
import { PrescriptionsPage } from "./pages/patient/pages/Prescriptions";
import { LabResultsPage } from "./pages/patient/pages/LabResults";
import { DocumentsPage } from "./pages/patient/pages/Documents";
import { ProfilePage } from "./pages/patient/pages/Profile";
import { IdentityPage } from "./pages/patient/pages/Identity";
import { FamilyAccessPage } from "./pages/patient/pages/FamilyAccess";
import { NotificationsPage } from "./pages/patient/pages/Notifications";
import { InsurancePage } from "./pages/patient/pages/Insurance";

// Doctor pages
import { DoctorPatientsPage } from "./pages/doctor/pages/Patients";
import { DoctorSchedulePage } from "./pages/doctor/pages/Schedule";
import { DoctorMessagesPage } from "./pages/doctor/pages/Messages";
import { DoctorConsultPage } from "./pages/doctor/pages/Consult";
import { DoctorLabsPage } from "./pages/doctor/pages/Labs";
import { DoctorScribePage } from "./pages/doctor/pages/Scribe";
import { DoctorRPMPage } from "./pages/doctor/pages/RPM";
import { DoctorERxPage } from "./pages/doctor/pages/ERx";
import { DoctorImagingPage } from "./pages/doctor/pages/Imaging";
import { DoctorReferralsPage } from "./pages/doctor/pages/Referrals";
import { DoctorBillingPage } from "./pages/doctor/pages/Billing";
import { DoctorEducationPage } from "./pages/doctor/pages/Education";

// Admin pages
import { AdminTreatmentsPage } from "./pages/admin/pages/Treatments";
import { AdminOrdersPage } from "./pages/admin/pages/Orders";
import { AdminMessagesPage } from "./pages/admin/pages/Messages";
import { AdminAnalyticsPage } from "./pages/admin/pages/Analytics";
import { AdminToolsPage } from "./pages/admin/pages/Tools";
import { AdminQuestionnairePage } from "./pages/admin/pages/Questionnaire";
import { AdminProductsPage } from "./pages/admin/pages/Products";
import { AdminBuildersPage } from "./pages/admin/pages/Builders";
import { AdminFinancePage } from "./pages/admin/pages/Finance";
import { AdminDiscountsPage } from "./pages/admin/pages/Discounts";
import { AdminAffiliatesPage } from "./pages/admin/pages/Affiliates";
import { AdminUsersPage } from "./pages/admin/pages/Users";
import { AdminAuditPage } from "./pages/admin/pages/Audit";
import { AdminSettingsPage } from "./pages/admin/pages/Settings";

import { PharmacyDashboard } from "./pages/pharmacy/Dashboard";
import { PharmacyInventoryPage } from "./pages/pharmacy/pages/Inventory";
import { PharmacyFulfillmentPage } from "./pages/pharmacy/pages/Fulfillment";
import { InsuranceDashboard } from "./pages/insurance/Dashboard";
import { InsuranceAuthorizationsPage } from "./pages/insurance/pages/Authorizations";
import { InsuranceMembersPage } from "./pages/insurance/pages/Members";
import { NurseDashboard } from "./pages/nurse/Dashboard";
import { NurseIntakePage } from "./pages/nurse/pages/Intake";
import { NurseVitalsPage } from "./pages/nurse/pages/Vitals";
import { CorporateDashboard } from "./pages/corporate/Dashboard";
import { CorporateEmployeesPage } from "./pages/corporate/pages/Employees";
import { CorporateAnalyticsPage } from "./pages/corporate/pages/Analytics";
import { CorporateBillingPage } from "./pages/corporate/pages/Billing";
import { AffiliateDashboard } from "./pages/affiliate/Dashboard";
import { AffiliateCommissionsPage } from "./pages/affiliate/pages/Commissions";
import { AffiliateAssetsPage } from "./pages/affiliate/pages/Assets";

import { NotFoundPage } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: LandingPage },

      // Patient portal
      {
        path: "patient",
        children: [
          { index: true, Component: PatientDashboard },
          { path: "appointments", Component: AppointmentsPage },
          { path: "intake", Component: IntakeFormsPage },
          { path: "visit-forms", Component: VisitFormsPage },
          { path: "messages", Component: MessagesPage },
          { path: "summaries", Component: VisitSummariesPage },
          { path: "prescriptions", Component: PrescriptionsPage },
          { path: "labs", Component: LabResultsPage },
          { path: "documents", Component: DocumentsPage },
          { path: "profile", Component: ProfilePage },
          { path: "identity", Component: IdentityPage },
          { path: "family", Component: FamilyAccessPage },
          { path: "notifications", Component: NotificationsPage },
          { path: "insurance", Component: InsurancePage },
        ],
      },

      // Doctor portal
      {
        path: "doctor",
        children: [
          { index: true, Component: DoctorDashboard },
          { path: "patients", Component: DoctorPatientsPage },
          { path: "schedule", Component: DoctorSchedulePage },
          { path: "messages", Component: DoctorMessagesPage },
          { path: "consult", Component: DoctorConsultPage },
          { path: "labs", Component: DoctorLabsPage },
          { path: "scribe", Component: DoctorScribePage },
          { path: "rpm", Component: DoctorRPMPage },
          { path: "erx", Component: DoctorERxPage },
          { path: "imaging", Component: DoctorImagingPage },
          { path: "referrals", Component: DoctorReferralsPage },
          { path: "billing", Component: DoctorBillingPage },
          { path: "education", Component: DoctorEducationPage },
        ],
      },

      // Admin portal
      {
        path: "admin",
        children: [
          { index: true, Component: AdminDashboard },
          { path: "treatments", Component: AdminTreatmentsPage },
          { path: "orders", Component: AdminOrdersPage },
          { path: "messages", Component: AdminMessagesPage },
          { path: "analytics", Component: AdminAnalyticsPage },
          { path: "tools", Component: AdminToolsPage },
          { path: "questionnaire", Component: AdminQuestionnairePage },
          { path: "products", Component: AdminProductsPage },
          { path: "builders", Component: AdminBuildersPage },
          { path: "finance", Component: AdminFinancePage },
          { path: "discounts", Component: AdminDiscountsPage },
          { path: "affiliates", Component: AdminAffiliatesPage },
          { path: "users", Component: AdminUsersPage },
          { path: "audit", Component: AdminAuditPage },
          { path: "settings", Component: AdminSettingsPage },
        ],
      },

      // New Portals
      {
        path: "pharmacy",
        children: [
          { index: true, Component: PharmacyDashboard },
          { path: "inventory", Component: PharmacyInventoryPage },
          { path: "fulfillment", Component: PharmacyFulfillmentPage },
        ],
      },
      {
        path: "insurance",
        children: [
          { index: true, Component: InsuranceDashboard },
          { path: "authorizations", Component: InsuranceAuthorizationsPage },
          { path: "members", Component: InsuranceMembersPage },
        ],
      },
      {
        path: "nurse",
        children: [
          { index: true, Component: NurseDashboard },
          { path: "intake", Component: NurseIntakePage },
          { path: "vitals", Component: NurseVitalsPage },
        ],
      },
      {
        path: "corporate",
        children: [
          { index: true, Component: CorporateDashboard },
          { path: "employees", Component: CorporateEmployeesPage },
          { path: "analytics", Component: CorporateAnalyticsPage },
          { path: "billing", Component: CorporateBillingPage },
        ],
      },
      {
        path: "affiliate",
        children: [
          { index: true, Component: AffiliateDashboard },
          { path: "commissions", Component: AffiliateCommissionsPage },
          { path: "assets", Component: AffiliateAssetsPage },
        ],
      },

      { path: "*", Component: NotFoundPage },
    ],
  },
]);
