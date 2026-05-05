// Centralized mock store for the patient portal.
// Source of truth for: brand config (white-label), active order pipeline,
// doctor availability, and prescription state. All UI surfaces (Dashboard,
// OrderTracking, Appointments, Shop) read from here so updates stay in sync.

export type OrderStatus =
  | "intake_submitted"
  | "doctor_review"
  | "prescribed"
  | "pharmacy"
  | "shipped"
  | "delivered";

export const ORDER_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "intake_submitted", label: "Intake Submitted", desc: "Your health questionnaire was received" },
  { key: "doctor_review", label: "Doctor Review", desc: "A licensed physician is reviewing your case" },
  { key: "prescribed", label: "Prescribed", desc: "Prescription approved and sent to pharmacy" },
  { key: "pharmacy", label: "At Pharmacy", desc: "Medication being prepared for shipment" },
  { key: "shipped", label: "Shipped", desc: "On its way to you" },
  { key: "delivered", label: "Delivered", desc: "Package delivered successfully" },
];

export type Order = {
  id: string;
  product: string;
  category: string;
  status: OrderStatus;
  date: string;
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
    id: "RX-A7K2M9",
    product: "Weight Loss Program",
    category: "GLP-1 / Metabolic",
    status: "shipped",
    date: "May 19, 2026",
    amount: "$199",
    doctor: "Dr. Sarah Johnson",
    doctorNote: "Approved. Starting dose: 0.25mg weekly. Follow up in 4 weeks.",
    tracking: "1Z999AA10123456784",
    carrier: "UPS",
    trackingUrl: "https://www.ups.com/track",
    estimatedDelivery: "May 22, 2026",
    timeline: [
      { status: "intake_submitted", date: "May 19, 9:02 AM" },
      { status: "doctor_review", date: "May 19, 11:30 AM" },
      { status: "prescribed", date: "May 19, 2:15 PM" },
      { status: "pharmacy", date: "May 19, 4:00 PM" },
      { status: "shipped", date: "May 20, 8:45 AM" },
    ],
  },
  {
    id: "RX-B3N8P1",
    product: "ED Treatment",
    category: "Men's Health",
    status: "doctor_review",
    date: "May 20, 2026",
    amount: "$49",
    doctor: "Dr. Marcus Thorne",
    doctorNote: null,
    tracking: null,
    carrier: null,
    trackingUrl: null,
    estimatedDelivery: null,
    timeline: [
      { status: "intake_submitted", date: "May 20, 8:00 AM" },
      { status: "doctor_review", date: "May 20, 10:00 AM" },
    ],
  },
];

export function getStepIndex(status: OrderStatus) {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

export function getActiveOrder() {
  return orders.find((o) => o.status !== "delivered") ?? orders[0];
}

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
