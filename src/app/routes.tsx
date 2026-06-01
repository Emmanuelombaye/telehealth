import { lazy } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { PublicLayout } from "./components/PublicLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import { lazyRetry } from "../lib/lazyRetry";

// --- LAZY LOADED PAGES ---
// Base & Auth
const LandingPage = lazy(() => lazyRetry(() => import("./pages/Landing").then(m => ({ default: m.LandingPage }))));
const AuthPage = lazy(() => lazyRetry(() => import("./pages/auth/AuthPage").then(m => ({ default: m.AuthPage }))));
const OsRegisterRedirect = lazy(() =>
  lazyRetry(() =>
    import("./pages/auth/OsRegisterRedirect").then((m) => ({ default: m.OsRegisterRedirect }))
  )
);
const ResetPasswordPage = lazy(() => lazyRetry(() => import("./pages/auth/ResetPassword").then(m => ({ default: m.ResetPasswordPage }))));
const NotFoundPage = lazy(() => lazyRetry(() => import("./pages/NotFound").then(m => ({ default: m.NotFoundPage }))));

// Treatments & Authority
const WeightLossPage = lazy(() => lazyRetry(() => import("./pages/treatments").then(m => ({ default: m.WeightLossPage }))));
const SexualWellnessPage = lazy(() => lazyRetry(() => import("./pages/treatments").then(m => ({ default: m.SexualWellnessPage }))));
const HairLossPage = lazy(() => lazyRetry(() => import("./pages/treatments").then(m => ({ default: m.HairLossPage }))));
const LongevityPage = lazy(() => lazyRetry(() => import("./pages/treatments").then(m => ({ default: m.LongevityPage }))));
const BioOptimizerPage = lazy(() => lazyRetry(() => import("./pages/treatments").then(m => ({ default: m.BioOptimizerPage }))));
const ClinicalResearchPage = lazy(() => lazyRetry(() => import("./pages/authority/ClinicalResearch").then(m => ({ default: m.ClinicalResearchPage }))));
const SupportHubPage = lazy(() => lazyRetry(() => import("./pages/SupportHub").then(m => ({ default: m.SupportHubPage }))));
const PortalsPage = lazy(() => lazyRetry(() => import("./pages/Portals").then(m => ({ default: m.PortalsPage }))));
const HowItWorksPage = lazy(() => lazyRetry(() => import("./pages/HowItWorks").then(m => ({ default: m.HowItWorksPage }))));
const FrequentlyAskedQuestionsPage = lazy(() => lazyRetry(() => import("./pages/FAQ").then(m => ({ default: m.FrequentlyAskedQuestionsPage }))));
const ExploreTreatmentsPage = lazy(() => lazyRetry(() => import("./pages/ExploreTreatments").then(m => ({ default: m.ExploreTreatmentsPage }))));
const TermsOfServicePage = lazy(() => lazyRetry(() => import("./pages/legal/TermsOfService").then(m => ({ default: m.TermsOfServicePage }))));
const PrivacyPolicyPage = lazy(() => lazyRetry(() => import("./pages/legal/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicyPage }))));
const RefundPolicyPage = lazy(() => lazyRetry(() => import("./pages/legal/RefundPolicy").then(m => ({ default: m.RefundPolicyPage }))));
const ShippingPolicyPage = lazy(() => lazyRetry(() => import("./pages/legal/ShippingPolicy").then(m => ({ default: m.ShippingPolicyPage }))));
const LlmsTxtPage = lazy(() => lazyRetry(() => import("./pages/legal/LlmsTxt").then(m => ({ default: m.LlmsTxtPage }))));
const SafetyInformationPage = lazy(() => lazyRetry(() => import("./pages/legal/SafetyInformation").then(m => ({ default: m.SafetyInformationPage }))));
const ConsentToTelehealthPage = lazy(() => lazyRetry(() => import("./pages/legal/ConsentToTelehealth").then(m => ({ default: m.ConsentToTelehealthPage }))));
const PhysicianCodeOfConductPage = lazy(() => lazyRetry(() => import("./pages/legal/PhysicianCodeOfConduct").then(m => ({ default: m.PhysicianCodeOfConductPage }))));
const BlogPage = lazy(() => lazyRetry(() => import("./pages/Blog").then(m => ({ default: m.BlogPage }))));

// Quiz
const SelectTreatmentPage = lazy(() => lazyRetry(() => import("./pages/quiz/SelectTreatment").then(m => ({ default: m.SelectTreatmentPage }))));
const ReviewsPage = lazy(() => lazyRetry(() => import("./pages/quiz/Reviews").then(m => ({ default: m.ReviewsPage }))));

// Patient Pages
const PatientDashboard = lazy(() => lazyRetry(() => import("./pages/patient/Dashboard").then(m => ({ default: m.PatientDashboard }))));
const PatientShopPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Shop").then(m => ({ default: m.PatientShopPage }))));
const PatientOrderTrackingPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/OrderTracking").then(m => ({ default: m.PatientOrderTrackingPage }))));
const AppointmentsPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Appointments").then(m => ({ default: m.AppointmentsPage }))));
const IntakeFormsPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/IntakeForms").then(m => ({ default: m.IntakeFormsPage }))));
const VisitFormsPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/VisitForms").then(m => ({ default: m.VisitFormsPage }))));
const MessagesPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Messages").then(m => ({ default: m.MessagesPage }))));
const VisitSummariesPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/VisitSummaries").then(m => ({ default: m.VisitSummariesPage }))));
const PrescriptionsPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Prescriptions").then(m => ({ default: m.PrescriptionsPage }))));
const LabResultsPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/LabResults").then(m => ({ default: m.LabResultsPage }))));
const DocumentsPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Documents").then(m => ({ default: m.DocumentsPage }))));
const ProfilePage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Profile").then(m => ({ default: m.ProfilePage }))));
const IdentityPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Identity").then(m => ({ default: m.IdentityPage }))));
const FamilyAccessPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/FamilyAccess").then(m => ({ default: m.FamilyAccessPage }))));
const NotificationsPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Notifications").then(m => ({ default: m.NotificationsPage }))));
const InsurancePage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Insurance").then(m => ({ default: m.InsurancePage }))));
const PatientConsultPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Consult").then(m => ({ default: m.PatientConsultPage }))));
const PatientVitalsPage = lazy(() => lazyRetry(() => import("./pages/patient/pages/Vitals").then(m => ({ default: m.PatientVitalsPage }))));

// Doctor Pages
const DoctorDashboard = lazy(() => lazyRetry(() => import("./pages/doctor/Dashboard").then(m => ({ default: m.DoctorDashboard }))));
const DoctorQueuePage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Queue").then(m => ({ default: m.DoctorQueuePage }))));
const DoctorAvailabilityPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Availability").then(m => ({ default: m.DoctorAvailabilityPage }))));
const DoctorPatientsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Patients").then(m => ({ default: m.DoctorPatientsPage }))));
const DoctorPatientDetailPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/PatientDetail").then(m => ({ default: m.DoctorPatientDetailPage }))));
const DoctorSchedulePage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Schedule").then(m => ({ default: m.DoctorSchedulePage }))));
const DoctorMessagesPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Messages").then(m => ({ default: m.DoctorMessagesPage }))));
const DoctorConsultPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Consult").then(m => ({ default: m.DoctorConsultPage }))));
const DoctorLabsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Labs").then(m => ({ default: m.DoctorLabsPage }))));
const DoctorScribePage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Scribe").then(m => ({ default: m.DoctorScribePage }))));
const RpmLayout = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmLayout }))));
const RpmLiveMonitoring = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmLiveMonitoring }))));
const RpmPatientVitalsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmPatientVitalsPage }))));
const RpmAlertsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmAlertsPage }))));
const RpmCriticalPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmCriticalPage }))));
const RpmDevicesPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmDevicesPage }))));
const RpmCompliancePage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmCompliancePage }))));
const RpmAiRiskPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmAiRiskPage }))));
const RpmAnalyticsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmAnalyticsPage }))));
const RpmQueuePage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmQueuePage }))));
const RpmEscalationsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmEscalationsPage }))));
const RpmReportsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmReportsPage }))));
const RpmIntegrationsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmIntegrationsPage }))));
const RpmSettingsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/RPM").then(m => ({ default: m.RpmSettingsPage }))));

const rpmChildRoutes = [
  { index: true, Component: RpmLiveMonitoring },
  { path: "vitals", Component: RpmPatientVitalsPage },
  { path: "alerts", Component: RpmAlertsPage },
  { path: "critical", Component: RpmCriticalPage },
  { path: "devices", Component: RpmDevicesPage },
  { path: "compliance", Component: RpmCompliancePage },
  { path: "ai-risk", Component: RpmAiRiskPage },
  { path: "analytics", Component: RpmAnalyticsPage },
  { path: "queue", Component: RpmQueuePage },
  { path: "escalations", Component: RpmEscalationsPage },
  { path: "reports", Component: RpmReportsPage },
  { path: "integrations", Component: RpmIntegrationsPage },
  { path: "settings", Component: RpmSettingsPage },
];
const DoctorVitalsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Vitals").then(m => ({ default: m.DoctorVitalsPage }))));
const DoctorClinicalIntakePage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/ClinicalIntake").then(m => ({ default: m.DoctorClinicalIntakePage }))));
const DoctorMedicalDocumentsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/MedicalDocuments").then(m => ({ default: m.DoctorMedicalDocumentsPage }))));
const DoctorERxPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/ERx").then(m => ({ default: m.DoctorERxPage }))));
const DoctorImagingPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Imaging").then(m => ({ default: m.DoctorImagingPage }))));
const DoctorReferralsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Referrals").then(m => ({ default: m.DoctorReferralsPage }))));
const DoctorBillingPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Billing").then(m => ({ default: m.DoctorBillingPage }))));
const DoctorEducationPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Education").then(m => ({ default: m.DoctorEducationPage }))));
const DoctorNotificationsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Notifications").then(m => ({ default: m.DoctorNotificationsPage }))));
const DoctorAnalyticsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Analytics").then(m => ({ default: m.DoctorAnalyticsPage }))));
const DoctorSettingsPage = lazy(() => lazyRetry(() => import("./pages/doctor/pages/Settings").then(m => ({ default: m.DoctorSettingsPage }))));

// Admin Pages
const AdminDashboard = lazy(() => lazyRetry(() => import("./pages/admin/Dashboard").then(m => ({ default: m.AdminDashboard }))));
const AdminPatientsPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Patients").then(m => ({ default: m.AdminPatientsPage }))));
const AdminTreatmentsPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Treatments").then(m => ({ default: m.AdminTreatmentsPage }))));
const AdminOrdersPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Orders").then(m => ({ default: m.AdminOrdersPage }))));
const AdminMessagesPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Messages").then(m => ({ default: m.AdminMessagesPage }))));
const AdminAnalyticsPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Analytics").then(m => ({ default: m.AdminAnalyticsPage }))));
const AdminToolsPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Tools").then(m => ({ default: m.AdminToolsPage }))));
const AdminQuestionnairePage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Questionnaire").then(m => ({ default: m.AdminQuestionnairePage }))));
const AdminProductsPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Products").then(m => ({ default: m.AdminProductsPage }))));
const AdminBuildersPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Builders").then(m => ({ default: m.AdminBuildersPage }))));
const AdminFinancePage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Finance").then(m => ({ default: m.AdminFinancePage }))));
const AdminDiscountsPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Discounts").then(m => ({ default: m.AdminDiscountsPage }))));
const AdminAffiliatesPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Affiliates").then(m => ({ default: m.AdminAffiliatesPage }))));
const AdminUsersPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Users").then(m => ({ default: m.AdminUsersPage }))));
const AdminAuditPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Audit").then(m => ({ default: m.AdminAuditPage }))));
const AdminSettingsPage = lazy(() => lazyRetry(() => import("./pages/admin/pages/Settings").then(m => ({ default: m.AdminSettingsPage }))));

// SuperAdmin Pages
const SuperAdminDashboard = lazy(() => lazyRetry(() => import("./pages/superadmin/Dashboard").then(m => ({ default: m.SuperAdminDashboard }))));
const SuperAdminBrandsPage = lazy(() => lazyRetry(() => import("./pages/superadmin/pages/Brands").then(m => ({ default: m.SuperAdminBrandsPage }))));
const SuperAdminAnalyticsPage = lazy(() => lazyRetry(() => import("./pages/superadmin/pages/Analytics").then(m => ({ default: m.SuperAdminAnalyticsPage }))));
const SuperAdminUsersPage = lazy(() => lazyRetry(() => import("./pages/superadmin/pages/Users").then(m => ({ default: m.SuperAdminUsersPage }))));
const SuperAdminDoctorsPage = lazy(() => lazyRetry(() => import("./pages/superadmin/pages/Doctors").then(m => ({ default: m.SuperAdminDoctorsPage }))));
const SuperAdminFinancePage = lazy(() => lazyRetry(() => import("./pages/superadmin/pages/Finance").then(m => ({ default: m.SuperAdminFinancePage }))));
const SuperAdminSecurityPage = lazy(() => lazyRetry(() => import("./pages/superadmin/pages/Security").then(m => ({ default: m.SuperAdminSecurityPage }))));

// Affiliate — Referly-branded partner portal (demo data until live API sync)
const AffiliateDashboard = lazy(() =>
  lazyRetry(() =>
    import("./pages/affiliate/AffiliateDashboard").then((m) => ({
      default: m.AffiliateDashboard,
    }))
  )
);

import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BrandProvider } from "./context/BrandContext";


export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <ScrollToTop />
        <BrandProvider>
          <Outlet />
        </BrandProvider>
      </>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      // --- PUBLIC PAGES (All use PublicLayout) ---
      {
        element: <PublicLayout />,
        children: [
          { index: true, Component: LandingPage },
          { path: "portals", Component: PortalsPage },

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

          // Legal & policies (Public)
          { path: "terms", Component: TermsOfServicePage },
          { path: "privacy", Component: PrivacyPolicyPage },
          { path: "refund", Component: RefundPolicyPage },
          { path: "shipping", Component: ShippingPolicyPage },
          { path: "llms", Component: LlmsTxtPage },
          { path: "safety", Component: SafetyInformationPage },
          { path: "consent", Component: ConsentToTelehealthPage },
          { path: "code-of-conduct", Component: PhysicianCodeOfConductPage },
          { path: "blog", Component: BlogPage },
          { path: "support", element: <Navigate to="/support-hub" replace /> },
          
          // Bio-Optimizer Hubs (Public)
          { path: "bio", Component: BioOptimizerPage },
          { path: "bio/:slug", Component: BioOptimizerPage },

          // Quiz Funnel
          { path: "quiz/select-treatment", Component: SelectTreatmentPage },
          { path: "quiz/:condition/reviews", Component: ReviewsPage },
        ]
      },

      // Auth (Isolated) — paths match live Peak Health OS deployment
      { path: "login", element: <AuthPage portal="patient" /> },
      { path: "auth/register", Component: OsRegisterRedirect },
      { path: "patient/login", element: <AuthPage portal="patient" /> },
      { path: "doctor/login", element: <AuthPage portal="doctor" /> },
      { path: "providers/login", element: <AuthPage portal="doctor" /> },
      { path: "admin/login", element: <AuthPage portal="admin" /> },
      { path: "superadmin/login", element: <AuthPage portal="superadmin" /> },
      { path: "affiliate/login", element: <AuthPage portal="affiliate" /> },
      { path: "pharmacy/login", element: <AuthPage portal="pharmacy" /> },
      { path: "reset-password", Component: ResetPasswordPage },

      // Patient Shop flow (Standalone) — shareable steps: /patient/shop/checkout, /create-account, etc.
      { path: "patient/shop/:step", Component: PatientShopPage },
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
              { path: "vitals", Component: PatientVitalsPage },
            ],
          },
          
          // Doctor Portal
          {
            path: "doctor",
            element: <ProtectedRoute allowedRoles={['doctor', 'super_admin']} />,
            children: [
              { index: true, Component: DoctorDashboard },
              { path: "workflow", element: <Navigate to=".." replace /> },
              { path: "patients", Component: DoctorPatientsPage },
              { path: "patients/:id", Component: DoctorPatientDetailPage },
              { path: "queue", Component: DoctorQueuePage },
              { path: "intake", Component: DoctorClinicalIntakePage },
              { path: "documents", Component: DoctorMedicalDocumentsPage },
              { path: "availability", Component: DoctorAvailabilityPage },
              { path: "schedule", Component: DoctorSchedulePage },
              { path: "messages", Component: DoctorMessagesPage },
              { path: "consult", Component: DoctorConsultPage },
              { path: "labs", Component: DoctorLabsPage },
              { path: "vitals", Component: DoctorVitalsPage },
              { path: "scribe", Component: DoctorScribePage },
              { path: "rpm", Component: RpmLayout, children: rpmChildRoutes },
              { path: "erx", Component: DoctorERxPage },
              { path: "imaging", Component: DoctorImagingPage },
              { path: "referrals", Component: DoctorReferralsPage },
              { path: "billing", Component: DoctorBillingPage },
              { path: "education", Component: DoctorEducationPage },
              { path: "analytics", Component: DoctorAnalyticsPage },
              { path: "settings", Component: DoctorSettingsPage },
              { path: "notifications", Component: DoctorNotificationsPage },
            ],
          },

          // Provider portal (URL alias for /doctor — same screens, same RBAC)
          {
            path: "providers",
            element: <ProtectedRoute allowedRoles={['doctor', 'super_admin']} />,
            children: [
              { index: true, Component: DoctorDashboard },
              { path: "workflow", element: <Navigate to=".." replace /> },
              { path: "patients", Component: DoctorPatientsPage },
              { path: "patients/:id", Component: DoctorPatientDetailPage },
              { path: "queue", Component: DoctorQueuePage },
              { path: "intake", Component: DoctorClinicalIntakePage },
              { path: "documents", Component: DoctorMedicalDocumentsPage },
              { path: "availability", Component: DoctorAvailabilityPage },
              { path: "schedule", Component: DoctorSchedulePage },
              { path: "messages", Component: DoctorMessagesPage },
              { path: "consult", Component: DoctorConsultPage },
              { path: "labs", Component: DoctorLabsPage },
              { path: "vitals", Component: DoctorVitalsPage },
              { path: "scribe", Component: DoctorScribePage },
              { path: "rpm", Component: RpmLayout, children: rpmChildRoutes },
              { path: "erx", Component: DoctorERxPage },
              { path: "imaging", Component: DoctorImagingPage },
              { path: "referrals", Component: DoctorReferralsPage },
              { path: "billing", Component: DoctorBillingPage },
              { path: "education", Component: DoctorEducationPage },
              { path: "analytics", Component: DoctorAnalyticsPage },
              { path: "settings", Component: DoctorSettingsPage },
              { path: "notifications", Component: DoctorNotificationsPage },
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
              { path: "audit", Component: AdminAuditPage },
              { path: "settings", Component: AdminSettingsPage },
              { path: "notifications", Component: DoctorNotificationsPage },
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
              { path: "audit", Component: AdminAuditPage },
              { path: "security", Component: SuperAdminSecurityPage },
              { path: "orders", Component: AdminOrdersPage },
              { path: "patients", Component: AdminPatientsPage },
              { path: "messages", Component: AdminMessagesPage },
              { path: "products", Component: AdminProductsPage },
              { path: "treatments", Component: AdminTreatmentsPage },
              { path: "questionnaires", Component: AdminQuestionnairePage },
              { path: "builders", Component: AdminBuildersPage },
              { path: "tools", Component: AdminToolsPage },
              { path: "discounts", Component: AdminDiscountsPage },
              { path: "affiliates", Component: AdminAffiliatesPage },
              { path: "settings", Component: AdminSettingsPage },
              { path: "notifications", Component: DoctorNotificationsPage },
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

          // Affiliate Portal — Referly-branded preview (demo auth + mock Referly sync)
          {
            path: "affiliate",
            element: <ProtectedRoute allowedRoles={['affiliate', 'super_admin']} />,
            children: [
              { index: true, Component: AffiliateDashboard },
              { path: "referrals", Component: AffiliateDashboard },
              { path: "payouts", Component: AffiliateDashboard },
              { path: "assets", Component: AffiliateDashboard },
              { path: "settings", Component: AffiliateDashboard },
            ],
          },
        ],
      },

      { path: "*", Component: NotFoundPage },
    ],
  },
]);
