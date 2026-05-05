import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Centralized reactive Zustand store for the patient portal.
// Source of truth for: brand config (white-label), active order pipeline,
// doctor availability, and prescription state. All UI surfaces (Dashboard,
// OrderTracking, Appointments, Shop) read from here so updates stay in sync.

// Pipeline steps shown on prescription cards. "awaiting_review" is a
// pre-pipeline state (consultation submitted, doctor hasn't responded yet)
// and is rendered as a compact card without the stepper.
export type OrderStatus =
  | "intake_submitted"
  | "doctor_reviewing"
  | "prescribing"
  | "shipping"
  | "tracking";

export const ORDER_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "intake_submitted", label: "Intake Submitted", desc: "Health questionnaire received by our clinical team" },
  { key: "doctor_reviewing", label: "Doctor Reviewing", desc: "A physician is reviewing your medical profile" },
  { key: "prescribing", label: "Prescribing", desc: "Prescription approved and sent to pharmacy" },
  { key: "shipping", label: "Shipping", desc: "Medication being prepared and shipped" },
  { key: "tracking", label: "Tracking", desc: "On its way to you" },
];

export type Order = {
  id: string;
  subBrand: string;
  medication: string;
  dosageInstructions: string;
  category: string;
  status: OrderStatus;
  orderedDate: string;
  consultationSubmittedDate?: string;
  pharmacy: string;
  amount: string;
  doctor: string;
  doctorNote: string | null;
  tracking: string | null;
  carrier: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  timeline: { status: OrderStatus; date: string }[];
};

export const orders: Order[] = [
  {
    id: "RX-G7K2M9",
    subBrand: "GlowRx",
    medication: "Tretinoin 0.05%",
    dosageInstructions: "Apply a pea-sized amount nightly to clean, dry skin",
    category: "Skincare",
    status: "prescribing",
    orderedDate: "Apr 30, 2026",
    pharmacy: "Truepill Pharmacy",
    amount: "$45",
    doctor: "Dr. Amira Hassan",
    doctorNote: "Approved. Start nightly, every other night for the first 2 weeks. Always pair with SPF 30+ in the morning.",
    tracking: null,
    carrier: null,
    trackingUrl: null,
    estimatedDelivery: "May 6, 2026",
    timeline: [
      { status: "intake_submitted", date: "Apr 30, 9:14 AM" },
      { status: "doctor_reviewing", date: "Apr 30, 11:02 AM" },
      { status: "prescribing", date: "May 1, 2:45 PM" },
    ],
  },
  {
    id: "RX-V3N8P1",
    subBrand: "VitalCare",
    medication: "Minoxidil Foam 5%",
    dosageInstructions: "Apply twice daily to affected areas",
    category: "Hair",
    status: "tracking",
    orderedDate: "Apr 21, 2026",
    pharmacy: "Truepill Pharmacy",
    amount: "$19",
    doctor: "Dr. Marcus Thorne",
    doctorNote: "Approved. Expect visible results in 3–6 months. Consistency matters more than quantity.",
    tracking: "1Z999AA10123456784",
    carrier: "UPS",
    trackingUrl: "https://www.ups.com/track",
    estimatedDelivery: "May 5, 2026",
    timeline: [
      { status: "intake_submitted", date: "Apr 21, 8:30 AM" },
      { status: "doctor_reviewing", date: "Apr 21, 10:15 AM" },
      { status: "prescribing", date: "Apr 22, 1:20 PM" },
      { status: "shipping", date: "Apr 22, 5:00 PM" },
      { status: "tracking", date: "Apr 24, 9:10 AM" },
    ],
  },
  {
    id: "RX-V8F4L2",
    subBrand: "VitalCare",
    medication: "Finasteride 1mg",
    dosageInstructions: "One tablet daily, with or without food",
    category: "Hair",
    status: "doctor_reviewing",
    orderedDate: "Apr 28, 2026",
    consultationSubmittedDate: "Apr 28, 2026",
    pharmacy: "Truepill Pharmacy",
    amount: "$25",
    doctor: "Pending assignment",
    doctorNote: null,
    tracking: null,
    carrier: null,
    trackingUrl: null,
    estimatedDelivery: null,
    timeline: [
      { status: "intake_submitted", date: "Apr 28, 7:42 AM" },
      { status: "doctor_reviewing", date: "Apr 28, 8:00 AM" },
    ],
  },
];

export function getStepIndex(status: OrderStatus) {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

export function getActiveOrder() {
  return orders.find((o) => o.status !== "tracking") ?? orders[0];
}

export function getAwaitingReviewCount() {
  return orders.filter((o) => o.status === "intake_submitted" || o.status === "doctor_reviewing").length;
}

// Authenticated patient — single source of truth for greeting and profile.
// Tenants override this when running Peak Health as a backend.
export const patientUser = {
  firstName: "John",
  lastName: "Carter",
  fullName: "John Carter",
  email: "john.carter@example.com",
};

export type DoctorAvailability = {
  id: number;
  name: string;
  specialty: string;
  avatar: string;
  available: boolean;
  wait: string;
  nextSlot: string;
};

export const doctorAvailability: DoctorAvailability[] = [
  { id: 1, name: "Dr. Sarah Johnson", specialty: "General Practice", avatar: "SJ", available: true, wait: "< 5 min", nextSlot: "Available now" },
  { id: 2, name: "Dr. Michael Chen", specialty: "Cardiology", avatar: "MC", available: true, wait: "< 15 min", nextSlot: "Today 11:00 AM" },
  { id: 3, name: "Dr. Amira Hassan", specialty: "Dermatology", avatar: "AH", available: false, wait: "Async only", nextSlot: "Tomorrow 9:00 AM" },
  { id: 4, name: "Dr. Carlos Rivera", specialty: "Endocrinology", avatar: "CR", available: true, wait: "< 30 min", nextSlot: "Today 2:30 PM" },
];

// White-label brand config — single source of truth for brand identity.
// Other tenants override this object to use Peak Health as a backend.
export const brand = {
  name: "Peak Health",
  shortName: "Peak",
  domain: "peakhealth.com",
  supportEmail: "support@peakhealth.com",
  tagline: "Global TeleHealth, HIPAA-compliant",
};

// Zustand Store Definition
interface PatientState {
  orders: Order[];
  doctorAvailability: DoctorAvailability[];
  intakeFormData: Record<string, any>;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  setIntakeFormData: (data: Record<string, any>) => void;
  updateDoctorAvailability: (doctorId: number, available: boolean) => void;
}

export const usePatientStore = create<PatientState>()(
  devtools(
    (set) => ({
      orders: orders,
      doctorAvailability: doctorAvailability,
      intakeFormData: {},

      addOrder: (order: Order) =>
        set((state) => ({
          orders: [...state.orders, order]
        })),

      updateOrderStatus: (orderId: string, status: OrderStatus) =>
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? {
                  ...order,
                  status,
                  timeline: [
                    ...order.timeline,
                    { status, date: new Date().toLocaleString() }
                  ]
                }
              : order
          )
        })),

      setIntakeFormData: (data: Record<string, any>) =>
        set((state) => ({
          intakeFormData: { ...state.intakeFormData, ...data }
        })),

      updateDoctorAvailability: (doctorId: number, available: boolean) =>
        set((state) => ({
          doctorAvailability: state.doctorAvailability.map(doctor =>
            doctor.id === doctorId
              ? { ...doctor, available }
              : doctor
          )
        })),
    })
  )
);
