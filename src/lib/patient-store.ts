import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from './supabaseClient';
import { useAuthStore } from './auth-store';
import {
  approveAndDispatchPrescription,
  fetchPatientPrescriptionsEnriched,
  requestPrescriptionRefill,
} from './prescriptions';
export type { PrescriptionRecord } from './prescriptions';
import { resolveOrdersFetchMode } from './adminScope';
import { isAuditPlaceholderOrder } from './clinicalTestData';
import { fetchOrdersRows, orderRefFromRow } from './ordersFetch';
import { countUnreadMessages } from './messagesFetch';
import { fetchVisitFormsForPatient } from './visitFormsFetch';
import { isDemoAuthWithoutSession } from './staffDemoAuth';
import { isMissingTableError } from './supabaseTableError';

// Centralized reactive Zustand store for the global state (Patient/Doctor/Admin).
// Source of truth for: brand config, active order pipeline, doctor availability.
// Uses local storage persist to simulate a real backend flow between portals.

export type OrderStatus =
  | "order_submitted"
  | "account_created"
  | "id_verified"
  | "intake_completed"
  | "medical_review"
  | "rx_sent"
  | "shipped"
  | "delivered"
  | "follow_up"
  | "refill_eligible";

export const ORDER_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "order_submitted", label: "Order Submitted", desc: "Treatment selection and payment received" },
  { key: "account_created", label: "Account Created", desc: "Patient portal account successfully registered" },
  { key: "id_verified", label: "ID Verified", desc: "Identity and age verification successful" },
  { key: "intake_completed", label: "Intake Completed", desc: "Health questionnaire and medical history received" },
  { key: "medical_review", label: "Medical Review", desc: "A licensed physician is evaluating your profile" },
  { key: "rx_sent", label: "Prescribed", desc: "Approval granted and prescription sent to pharmacy" },
  { key: "shipped", label: "Shipped", desc: "Medication is in transit to your address" },
  { key: "delivered", label: "Delivered", desc: "Package has been successfully delivered" },
  { key: "follow_up", label: "Follow-Up Required", desc: "Your physician needs additional information to proceed" },
  { key: "refill_eligible", label: "Refill Eligible", desc: "You are now eligible to request a treatment refill" },
];

export type Order = {
  /** order_number (human-readable ref) */
  id: string;
  /** Supabase orders.id UUID */
  dbId?: string;
  patientName: string;
  patientAvatar: string;
  patientAge: number;
  patientCountry: string;
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
  urgent?: boolean;
  intakeComplete?: boolean;
  intakeNotes?: string;
  intakeAnswers?: Record<string, string | string[]>;
  consultationTime?: string;
  waitMins?: number;
  time?: string;
  mrn?: string;
  patient_vitals?: any;
  patientVitals?: any;
  patient_age?: number;
  patient_country?: string;
  zoom_status?: 'requested' | 'not_requested' | 'confirmed' | 'rescheduled' | 'canceled';
  zoom_doctor_message?: string | null;
  zoom_rescheduled_time?: string | null;
  consultation_time?: string | null;
  lastApprovedAt?: string | null;
  nextRefillAt?: string | null;
  refillIntervalDays?: number;
  zoomStatus?: 'requested' | 'not_requested' | 'confirmed' | 'rescheduled' | 'canceled';
  /** True when enrollment (Path A) required sync video — distinct from clinician-only 5B video. See `orders.enrollment_video_required`. */
  enrollmentVideoRequired?: boolean;
  userId?: string;
  user_id?: string;
  doctor_id?: string;
  // DB column aliases (snake_case from Supabase)
  created_at?: string;
  sub_brand?: string;
  order_number?: string;
  patient_name?: string;
  ordered_date?: string;
}

// Helper: Generate a unique Medical Record Number (MRN)
export const generateMRN = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  const prefix = letters.charAt(Math.floor(Math.random() * letters.length));
  const middle = Array.from({ length: 4 }, () => nums.charAt(Math.floor(Math.random() * nums.length))).join("");
  const suffix = Array.from({ length: 3 }, () => nums.charAt(Math.floor(Math.random() * nums.length))).join("");
  return `${prefix}${middle}${suffix}`;
};

// Removed mock initialOrders to enforce strict backend data fetching

/** Cheap fingerprint — skip Zustand updates when realtime refetch returns identical queue data. */
function ordersListFingerprint(orders: Order[]): string {
  return orders
    .map(
      (o) =>
        `${o.id}:${o.status}:${o.zoomStatus ?? ""}:${o.enrollmentVideoRequired ? 1 : 0}:${o.urgent ? 1 : 0}:${o.medication ?? ""}`,
    )
    .join("|");
}

export function getStepIndex(status: OrderStatus) {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

export function getActiveOrder(orders: Order[]) {
  return orders.find((o) => o.status !== "shipped" && o.status !== "delivered") ?? orders[0];
}

export function getAwaitingReviewCount(orders: Order[]) {
  return orders.filter((o) => o.status === "order_submitted" || o.status === "medical_review").length;
}

export const patientUser = {
  firstName: "John",
  lastName: "Carter",
  fullName: "John Carter",
  email: "john.carter@example.com",
};

export type DoctorAvailability = {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  available: boolean;
  wait_time?: string;
  wait?: string; // fallback
  next_slot?: string;
  nextSlot?: string; // fallback
};

export const brand = {
  name: "Peak Health",
  shortName: "Peak",
  domain: "peakhealth.com",
  supportEmail: "support@peakhealth.com",
  tagline: "Global TeleHealth, HIPAA-compliant",
};

interface AppState {
  orders: Order[];
  prescriptions: import("./prescriptions").PrescriptionRecord[];
  visitForms: any[];
  notifications: any[];
  doctorAvailability: DoctorAvailability[];
  intakeFormData: Record<string, unknown>;
  prescriptionsLoading: boolean;
  visitFormsLoading: boolean;
  unreadMessagesCount: number;
  fetchOrders: () => Promise<void>;
  fetchPrescriptions: () => Promise<void>;
  fetchVisitForms: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchUnreadMessages: () => Promise<void>;
  fetchDoctorAvailability: () => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, tracking?: string, carrier?: string, trackingUrl?: string, estimatedDelivery?: string) => Promise<void>;
  updateOrderRx: (orderId: string, medication: string, dosage: string, note: string) => Promise<void>;
  subscribeToOrders: () => (() => void);
  setIntakeFormData: (data: Record<string, unknown>) => void;
  updateDoctorAvailability: (doctorId: string, available: boolean) => Promise<void>;
  approveRefill: (orderId: string) => Promise<void>;
  requestRefill: (orderNumber: string, note?: string) => Promise<{ ok: boolean; error?: string }>;
  resetStore: () => void;
}


export const usePatientStore = create<AppState>()(
  devtools(
    (set, get) => ({
      orders: [],
      prescriptions: [],
      visitForms: [],
      notifications: [],
      unreadMessagesCount: 0,
      doctorAvailability: [],
      intakeFormData: {},
      prescriptionsLoading: false,
      visitFormsLoading: false,

      subscribeToOrders: () => {
        let ordersDebounce: ReturnType<typeof setTimeout> | null = null;
        const scheduleOrdersRefresh = () => {
          if (ordersDebounce) clearTimeout(ordersDebounce);
          ordersDebounce = setTimeout(() => {
            get().fetchOrders();
          }, 1500);
        };

        const channelId = `global-sync-${Math.random().toString(36).slice(2, 9)}`;
        
        const channel = supabase
          .channel(channelId)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'orders'
          }, () => {
            scheduleOrdersRefresh();
          })
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'messages'
          }, (payload) => {
            get().fetchUnreadMessages();
          })
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'prescriptions'
          }, (payload) => {
            get().fetchPrescriptions();
          })
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'intake_forms'
          }, () => {
            get().fetchVisitForms();
          })
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'notifications'
          }, (payload) => {
            get().fetchNotifications();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },

      fetchUnreadMessages: async () => {
        try {
          const { user, session } = useAuthStore.getState();
          if (!user || isDemoAuthWithoutSession(user, session)) {
            set({ unreadMessagesCount: 0 });
            return;
          }
          const { count, error } = await countUnreadMessages(user.id);
          
          if (error) {
            if (error.code === 'PGRST303') console.warn("Session Expired: Please re-login to refresh clinical data.");
            throw error;
          }
          set({ unreadMessagesCount: count || 0 });
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      },

      fetchPrescriptions: async () => {
        set({ prescriptionsLoading: true });
        try {
          const { user, session } = useAuthStore.getState();
          if (!user || isDemoAuthWithoutSession(user, session)) {
            set({ prescriptions: [] });
            return;
          }
          const rows = await fetchPatientPrescriptionsEnriched(user.id);
          set({ prescriptions: rows });
        } catch (error: unknown) {
          const err = error as { code?: string };
          if (err?.code === 'PGRST303') console.warn("Session Expired: Please re-login to view prescriptions.");
          console.error('Error fetching prescriptions:', error);
        } finally {
          set({ prescriptionsLoading: false });
        }
      },

      requestRefill: async (orderNumber: string, note?: string) => {
        return requestPrescriptionRefill(orderNumber, note);
      },

      fetchVisitForms: async () => {
        set({ visitFormsLoading: true });
        try {
          const { user, session } = useAuthStore.getState();
          if (!user || isDemoAuthWithoutSession(user, session)) {
            set({ visitForms: [] });
            return;
          }

          const { data, error } = await fetchVisitFormsForPatient(user.id);

          if (error) {
            if (error.code === 'PGRST303') console.warn("Session Expired: Please re-login to view visit forms.");
            if (!isMissingTableError(error)) throw error;
          }
          set({ visitForms: data || [] });
        } catch (error) {
          if (!isMissingTableError(error as { code?: string; message?: string })) {
            console.error('Error fetching visit forms:', error);
          }
        } finally {
          set({ visitFormsLoading: false });
        }
      },

      fetchNotifications: async () => {
        try {
          const { user, session } = useAuthStore.getState();
          if (!user || isDemoAuthWithoutSession(user, session)) {
            set({ notifications: [] });
            return;
          }
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (error) {
            if (error.code === 'PGRST303') console.warn("Session Expired: Please re-login to view notifications.");
            throw error;
          }
          set({ notifications: data || [] });
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      },

      fetchDoctorAvailability: async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, first_name, last_name, specialty, avatar_url, status')
            .eq('role', 'doctor')
            .eq('status', 'active')
            .order('full_name', { ascending: true });
          if (error) throw error;

          const mappedDocs: DoctorAvailability[] = (data || []).map((d) => {
            const name =
              d.full_name ||
              [d.first_name, d.last_name].filter(Boolean).join(' ') ||
              'Clinical provider';
            const initials = name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((s: string) => s[0])
              .join('')
              .toUpperCase();
            return {
              id: d.id,
              name,
              specialty: d.specialty || 'General Practice',
              avatar: d.avatar_url || initials,
              available: true,
              wait: '< 15 min',
              nextSlot: 'Book intake',
            };
          });
          set({ doctorAvailability: mappedDocs });
        } catch (error) {
          console.error('Error fetching doctors:', error);
        }
      },

      fetchOrders: async () => {
        try {
          const { role, brandId, user } = useAuthStore.getState();
          const mode = resolveOrdersFetchMode(role);

          const { data: rawRows, error } = await fetchOrdersRows(role, brandId, user?.id);
          if (error) {
            if (error.code === 'PGRST303') console.warn("Session Expired: Please re-login to sync orders.");
            if (error.code === '42P17') {
              console.error("[CRITICAL] Infinite recursion detected in Supabase RLS policies. Please run the fix script in supabase_fix_recursion_v2.sql");
              return;
            }
            throw error;
          }
          
          const mappedOrders: Order[] = rawRows.map(d => ({
            id: orderRefFromRow(d),
            dbId: d.id as string,
            userId: d.user_id as string,
            user_id: d.user_id as string,
            patientName: (d.patient_name as string) || 'Patient',
            patientAvatar: (d.patient_avatar as string) || '',
            patientAge: (d.patient_age as number) ?? 0,
            patientCountry: (d.patient_country as string) || '',
            subBrand: (d.sub_brand as string) || '',
            medication: (d.medication as string) || '',
            dosageInstructions: (d.dosage_instructions as string) || '',
            category: (d.category as string) || '',
            status: d.status as OrderStatus,
            orderedDate: (d.ordered_date as string) || '',
            consultationSubmittedDate: d.consultation_submitted_date as string | undefined,
            pharmacy: (d.pharmacy as string) || '',
            amount: d.amount != null ? String(d.amount) : '',
            doctor: (d.doctor as string) || '',
            doctorNote: mode === 'admin' ? null : (d.doctor_note as string | null),
            tracking: (d.tracking as string | null) ?? (d.tracking_number as string | null),
            carrier: d.carrier as string | null,
            trackingUrl: d.tracking_url as string | null,
            estimatedDelivery: d.estimated_delivery as string | null,
            timeline: (d.timeline as Order['timeline']) || [],
            urgent: !!d.urgent,
            intakeComplete: !!d.intake_complete,
            intakeNotes: mode === 'admin' ? undefined : (d.intake_notes as string | undefined),
            intakeAnswers: mode === 'admin' ? undefined : (d.intake_answers as Record<string, string | string[]> | undefined),
            patientVitals: mode === 'admin' ? undefined : (d.patient_vitals as Order['patientVitals']),
            zoomStatus: d.zoom_status as Order['zoomStatus'],
            enrollmentVideoRequired: !!(
              d.enrollment_video_required ??
              (typeof d.intake_answers === "object" &&
                d.intake_answers !== null &&
                "_scheduling" in d.intake_answers)
            ),
            zoomDoctorMessage: mode === 'admin' ? null : (d.zoom_doctor_message as string | null),
            zoomRescheduledTime: d.zoom_rescheduled_time as string | undefined,
            consultationTime: d.consultation_time as string | undefined,
            waitMins: d.wait_mins as number | undefined,
            time: d.time as string | undefined,
            mrn: (d.mrn as string) || generateMRN(),
            lastApprovedAt: d.last_approved_at as string | null,
            nextRefillAt: d.next_refill_at as string | null,
            refillIntervalDays: d.refill_interval_days as number | undefined,
            doctor_id: d.doctor_id as string | undefined,
            created_at: d.created_at as string | undefined,
            order_number: d.order_number as string | undefined,
          }));
          const clinicalOrders = mappedOrders.filter(
            (o) =>
              !isAuditPlaceholderOrder({
                patient_name: o.patientName,
                order_number: o.id,
                medication: o.medication,
              }),
          );
          const prev = get().orders;
          if (ordersListFingerprint(prev) !== ordersListFingerprint(clinicalOrders)) {
            set({ orders: clinicalOrders });
          }
        } catch (error) {
          console.error('Error fetching orders from Supabase:', error);
        }
      },


      addOrder: async (order: Order) => {
        set((state) => ({ orders: [...state.orders, order] }));
        try {
          await supabase.from('orders').insert([{
            order_number: order.id,
            patient_name: order.patientName,
            patient_avatar: order.patientAvatar,
            patient_age: order.patientAge,
            patient_country: order.patientCountry,
            sub_brand: order.subBrand,
            medication: order.medication,
            dosage_instructions: order.dosageInstructions,
            category: order.category,
            status: order.status,
            ordered_date: order.orderedDate,
            pharmacy: order.pharmacy,
            amount: order.amount,
            doctor: order.doctor,
            urgent: order.urgent,
            intake_complete: order.intakeComplete,
            intake_notes: order.intakeNotes,
            wait_mins: order.waitMins,
            time: order.time,
            mrn: order.mrn || generateMRN(),
            timeline: order.timeline,
            last_approved_at: order.lastApprovedAt,
            refill_interval_days: order.refillIntervalDays || 30
          }]);
        } catch (error) {
          console.error('Error adding order to Supabase:', error);
        }
      },

      updateOrderStatus: async (orderId: string, status: OrderStatus, tracking?: string, carrier?: string, trackingUrl?: string, estimatedDelivery?: string) => {
        const orderToUpdate = get().orders.find(o => o.id === orderId);
        if (!orderToUpdate) return;
        
        const newTimeline = [...orderToUpdate.timeline, { status, date: new Date().toLocaleString() }];
        
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? {
                  ...order,
                  status,
                  ...(tracking && { tracking }),
                  ...(carrier && { carrier }),
                  ...(trackingUrl && { trackingUrl }),
                  ...(estimatedDelivery && { estimatedDelivery }),
                  timeline: newTimeline
                }
              : order
          )
        }));

        try {
          await supabase.from('orders').update({
            status,
            ...(tracking && { tracking_number: tracking }),
            ...(carrier && { carrier }),
            ...(trackingUrl && { tracking_url: trackingUrl }),
            ...(estimatedDelivery && { estimated_delivery: estimatedDelivery }),
            timeline: newTimeline
          }).eq('order_number', orderId);
        } catch (error) {
          console.error('Error updating order status in Supabase:', error);
        }
      },
        
      updateOrderRx: async (orderId: string, medication: string, dosage: string, note: string) => {
        try {
          const orderToUpdate = get().orders.find(o => o.id === orderId);
          const result = await approveAndDispatchPrescription({
            orderKey: orderToUpdate?.dbId || orderId,
            patientId: orderToUpdate?.userId || orderToUpdate?.user_id,
            medication,
            dosageInstructions: dosage,
            doctorNote: note,
            pharmacy: orderToUpdate?.pharmacy || "truepill",
          });
          if (!result.ok) throw new Error(result.error || "Dispatch failed");
          await get().fetchOrders();
        } catch (error) {
          console.error("Failed to update rx:", error);
        }
      },

      approveRefill: async (orderId: string) => {
        try {
          const orderToUpdate = get().orders.find(o => o.id === orderId);
          const result = await approveAndDispatchPrescription({
            orderKey: orderToUpdate?.dbId || orderId,
            patientId: orderToUpdate?.userId || orderToUpdate?.user_id,
            medication: orderToUpdate?.medication || "Refill",
            dosageInstructions: orderToUpdate?.dosageInstructions || "As directed",
            doctorNote: "Refill approved by physician.",
            pharmacy: orderToUpdate?.pharmacy || "truepill",
            refillsRemaining: 3,
          });
          if (!result.ok) throw new Error(result.error || "Refill dispatch failed");
          await get().fetchOrders();
        } catch (error) {
          console.error("Failed to approve refill:", error);
        }
      },

      setIntakeFormData: (data) => set({ intakeFormData: data }),

      updateDoctorAvailability: async (_doctorId, _available) => {
        // Legacy hook — availability is derived from active doctor profiles.
        await get().fetchDoctorAvailability();
      },

      resetStore: () => set({ orders: [], intakeFormData: {} }),
    })
  )
);
