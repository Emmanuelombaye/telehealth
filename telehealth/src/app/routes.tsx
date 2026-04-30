import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { LandingPage } from "./pages/Landing";
import { PatientDashboard } from "./pages/patient/Dashboard";
import { DoctorDashboard } from "./pages/doctor/Dashboard";
import { AdminDashboard } from "./pages/admin/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: LandingPage },
      {
        path: "patient",
        children: [
          { index: true, Component: PatientDashboard },
          { path: "book", Component: () => <div>Booking Page</div> },
          { path: "chat", Component: () => <div>Secure Messaging</div> },
          { path: "records", Component: () => <div>Medical Records</div> },
          { path: "profile", Component: () => <div>Patient Profile</div> },
        ]
      },
      {
        path: "doctor",
        children: [
          { index: true, Component: DoctorDashboard },
          { path: "patients", Component: () => <div>Patient Management</div> },
          { path: "schedule", Component: () => <div>Doctor Schedule</div> },
          { path: "messages", Component: () => <div>Doctor Messages</div> },
          { path: "consult", Component: () => <div>Consultation Workspace</div> },
          { path: "labs", Component: () => <div>Lab Requests</div> },
        ]
      },
      {
        path: "admin",
        children: [
          { index: true, Component: AdminDashboard },
          { path: "users", Component: () => <div>User Management</div> },
          { path: "audit", Component: () => <div>Audit Logs</div> },
          { path: "settings", Component: () => <div>System Settings</div> },
        ]
      },
      {
        path: "*",
        Component: () => <div className="flex items-center justify-center h-full">404 - Portal Not Found</div>
      }
    ],
  },
]);
