import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { PublicLayout } from "./components/PublicLayout";
import { LandingPage } from "./pages/Landing";
import { PatientDashboard } from "./pages/patient/Dashboard";
import { DoctorDashboard } from "./pages/doctor/Dashboard";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { WeightLossPage, SexualWellnessPage, HairLossPage, LongevityPage, BioOptimizerPage } from "./pages/treatments";
import { ClinicalResearchPage } from "./pages/authority/ClinicalResearch";
import { SupportHubPage } from "./pages/SupportHub";
import { HowItWorksPage } from "./pages/HowItWorks";
import { FrequentlyAskedQuestionsPage } from "./pages/FAQ";
import { ExploreTreatmentsPage } from "./pages/ExploreTreatments";
import { SelectTreatmentPage } from "./pages/quiz/SelectTreatment";
import { ReviewsPage } from "./pages/quiz/Reviews";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Patient pages
import { PatientShopPage } from "./pages/patient/pages/Shop";
import { PatientOrderTrackingPage } from "./pages/patient/pages/OrderTracking";
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
import { PatientConsultPage } from "./pages/patient/pages/Consult";

// Doctor pages
import { DoctorQueuePage } from "./pages/doctor/pages/Queue";
import { DoctorAvailabilityPage } from "./pages/doctor/pages/Availability";
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
import { AdminPatientsPage } from "./pages/admin/pages/Patients";
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



import { SuperAdminDashboard } from "./pages/superadmin/Dashboard";
import { SuperAdminBrandsPage } from "./pages/superadmin/pages/Brands";
import { SuperAdminAnalyticsPage } from "./pages/superadmin/pages/Analytics";
import { SuperAdminUsersPage } from "./pages/superadmin/pages/Users";
import { SuperAdminDoctorsPage } from "./pages/superadmin/pages/Doctors";
import { SuperAdminFinancePage } from "./pages/superadmin/pages/Finance";
import { SuperAdminSecurityPage } from "./pages/superadmin/pages/Security";

// Pharmacy pages
import { 
  PharmacyDashboard, PharmacyOrdersPage, PharmacyShippingPage, 
  PharmacyInventoryPage, PharmacySettingsPage 
} from "./pages/pharmacy/pages";

import { NotFoundPage } from "./pages/NotFound";
import { AuthPage } from "./pages/auth/AuthPage";
import { ResetPasswordPage } from "./pages/auth/ResetPassword";
import { ProtectedRoute } from "./components/ProtectedRoute";


export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorBoundary />,
    children: [
      // --- PUBLIC PAGES (All use PublicLayout) ---
      {
        element: <PublicLayout />,
        children: [
          { index: true, Component: LandingPage },
          
          // Treatment Hubs (Public)
          { path: "treatments/weight-loss", Component: WeightLossPage },
          { path: "treatments/sexual-wellness", Component: SexualWellnessPage },
          { path: "treatments/hair-loss", Component: HairLossPage },
          { path: "treatments/longevity", Component: LongevityPage },
          
          // Authority & Support (Public)
          { path: "clinical-research", Component: ClinicalResearchPage },
          { path: "support-hub", Component: SupportHubPage },
          { path: "how-it-works", Component: HowItWorksPage },
          { path: "explore-treatments", Component: ExploreTreatmentsPage },
          { path: "frequently-asked-questions", Component: FrequentlyAskedQuestionsPage },
          { path: "faq", Component: FrequentlyAskedQuestionsPage },
          
          // Bio-Optimizer Hubs (Public)
          { path: "bio", Component: BioOptimizerPage },
          { path: "bio/:slug", Component: BioOptimizerPage },

          // Quiz Funnel
          { path: "quiz/select-treatment", Component: SelectTreatmentPage },
          { path: "quiz/:condition/reviews", Component: ReviewsPage },
        ]
      },

      // Auth (Isolated)
      { path: "patient/login", element: <AuthPage portal="patient" /> },
      { path: "doctor/login", element: <AuthPage portal="doctor" /> },
      { path: "admin/login", element: <AuthPage portal="admin" /> },
      { path: "superadmin/login", element: <AuthPage portal="superadmin" /> },
      { path: "reset-password", Component: ResetPasswordPage },
      // { path: "pharmacy/login", element: <AuthPage portal="pharmacy" /> },

      // Patient Shop flow (Standalone)
      { path: "patient/shop", Component: PatientShopPage },

      // --- PROTECTED PORTALS (All use AppLayout) ---
      {
        element: <AppLayout />,
        children: [
          // Patient Portal
          {
            path: "patient",
            element: <ProtectedRoute allowedRoles={['patient', 'super_admin']} />,
            children: [
              { index: true, Component: PatientDashboard },
              { path: "orders", Component: PatientOrderTrackingPage },
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
              { path: "consult", Component: PatientConsultPage },
            ],
          },
          
          // Doctor Portal
          {
            path: "doctor",
            element: <ProtectedRoute allowedRoles={['doctor', 'super_admin']} />,
            children: [
              { index: true, Component: DoctorDashboard },
              { path: "patients", Component: DoctorPatientsPage },
              { path: "queue", Component: DoctorQueuePage },
              { path: "availability", Component: DoctorAvailabilityPage },
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

          // Admin Portal
          {
            path: "admin",
            element: <ProtectedRoute allowedRoles={['brand_admin', 'super_admin']} />,
            children: [
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
              { path: "settings", Component: AdminSettingsPage },
            ],
          },

          // SuperAdmin portal
          {
            path: "superadmin",
            element: <ProtectedRoute allowedRoles={['super_admin']} />,
            children: [
              { index: true, Component: SuperAdminDashboard },
              { path: "brands", Component: SuperAdminBrandsPage },
              { path: "brands/:slug", Component: SuperAdminBrandsPage },
              { path: "analytics", Component: SuperAdminAnalyticsPage },
              { path: "users", Component: SuperAdminUsersPage },
              { path: "doctors", Component: SuperAdminDoctorsPage },
              { path: "finance", Component: SuperAdminFinancePage },
              { path: "security", Component: SuperAdminSecurityPage },
              { path: "orders", Component: AdminOrdersPage }, // Reusing the high-fidelity orders view for SuperAdmin
              { path: "products", Component: AdminProductsPage },
              { path: "settings", Component: AdminSettingsPage },
            ],
          },

          // Pharmacy portal (Disabled for automated webhook flow)
          /* 
          {
            path: "pharmacy",
            element: <ProtectedRoute allowedRoles={['pharmacy', 'doctor', 'brand_admin', 'super_admin']} />,
            children: [
              { index: true, Component: PharmacyDashboard },
              { path: "orders", Component: PharmacyOrdersPage },
              { path: "pickup", Component: PharmacyOrdersPage },
              { path: "shipping", Component: PharmacyShippingPage },
              { path: "compounding", Component: PharmacyInventoryPage },
              { path: "inventory", Component: PharmacyInventoryPage },
              { path: "audit", Component: PharmacyInventoryPage },
              { path: "settings", Component: PharmacySettingsPage },
            ],
          },
          */
        ],
      },

      { path: "*", Component: NotFoundPage },
    ],
  },
]);
