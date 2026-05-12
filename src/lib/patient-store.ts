import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase } from './supabaseClient';
import { useAuthStore } from './auth-store';

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
  { key: "refill_eligible", label: "Refill Eligible", desc: "You are now eligible to request a treatment refill" },
];

export type Order = {
  id: string;
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
  id: number;
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
  prescriptions: any[];
  fetchOrders: () => Promise<void>;
  fetchPrescriptions: () => Promise<void>;
  fetchUnreadMessages: () => Promise<void>;
  unreadMessagesCount: number;
  fetchDoctorAvailability: () => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, tracking?: string, carrier?: string, trackingUrl?: string, estimatedDelivery?: string) => Promise<void>;
  updateOrderRx: (orderId: string, medication: string, dosage: string, note: string) => Promise<void>;
  subscribeToOrders: () => (() => void);
  setIntakeFormData: (data: Record<string, any>) => void;
  updateDoctorAvailability: (doctorId: number, available: boolean) => Promise<void>;
  approveRefill: (orderId: string) => Promise<void>;
  resetStore: () => void;
}


export const usePatientStore = create<AppState>()(
  devtools(
    (set, get) => ({
      orders: [],
      prescriptions: [],
      unreadMessagesCount: 0,
      doctorAvailability: [],
      intakeFormData: {},

      subscribeToOrders: () => {
        const { user, role } = useAuthStore.getState();
        const channelId = `global-sync-${Math.random().toString(36).slice(2, 9)}`;
        
        const channel = supabase
          .channel(channelId)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'orders'
          }, (payload) => {
            get().fetchOrders();
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
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },

      fetchUnreadMessages: async () => {
        try {
          const { data, count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);
          
          if (error) throw error;
          set({ unreadMessagesCount: count || 0 });
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      },

      fetchPrescriptions: async () => {
        try {
          const { user } = useAuthStore.getState();
          if (!user) return;
          const { data, error } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('patient_id', user.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          set({ prescriptions: data || [] });
        } catch (error) {
          console.error('Error fetching prescriptions:', error);
        }
      },

      fetchDoctorAvailability: async () => {
        try {
          const { data, error } = await supabase.from('doctor_availability').select('*').order('id', { ascending: true });
          if (error) throw error;
          
          const mappedDocs = (data || []).map(d => ({
            id: d.id,
            name: d.name,
            specialty: d.specialty,
            avatar: d.avatar,
            available: d.available,
            wait: d.wait_time || '< 5 min',
            nextSlot: d.next_slot || 'Available now'
          }));
          set({ doctorAvailability: mappedDocs });
        } catch (error) {
          console.error('Error fetching doctors:', error);
        }
      },

      fetchOrders: async () => {
        try {
          const { role, brandId, user } = useAuthStore.getState();
          let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
          
          if (role === 'patient' && user) {
            query = query.eq('user_id', user.id);
          } else if (role === 'brand_admin' && brandId) {
            query = query.eq('sub_brand', brandId);
          }
          // Doctors and super_admins see all (doctors filter locally in the UI to order_submitted)

          const { data, error } = await query;
          if (error) {
            if (error.code === '42P17') {
              console.error("[CRITICAL] Infinite recursion detected in Supabase RLS policies. Please run the fix script in supabase_fix_recursion_v2.sql");
              return;
            }
            throw error;
          }
          
          const mappedOrders: Order[] = (data || []).map(d => ({
            id: d.order_number,
            userId: d.user_id,
            user_id: d.user_id,
            patientName: d.patient_name,
            patientAvatar: d.patient_avatar || '',
            patientAge: d.patient_age,
            patientCountry: d.patient_country,
            subBrand: d.sub_brand,
            medication: d.medication,
            dosageInstructions: d.dosage_instructions,
            category: d.category,
            status: d.status as OrderStatus,
            orderedDate: d.ordered_date,
            consultationSubmittedDate: d.consultation_submitted_date,
            pharmacy: d.pharmacy,
            amount: d.amount,
            doctor: d.doctor,
            doctorNote: d.doctor_note,
            tracking: d.tracking,
            carrier: d.carrier,
            trackingUrl: d.tracking_url,
            estimatedDelivery: d.estimated_delivery,
            timeline: d.timeline || [],
            urgent: d.urgent,
            intakeComplete: d.intake_complete,
            intakeNotes: d.intake_notes,
            intakeAnswers: d.intake_answers,
            patientVitals: d.patient_vitals,
            zoomStatus: d.zoom_status,
            zoomDoctorMessage: d.zoom_doctor_message,
            zoomRescheduledTime: d.zoom_rescheduled_time,
            consultationTime: d.consultation_time,
            waitMins: d.wait_mins,
            time: d.time,
            mrn: d.mrn || generateMRN(),
            lastApprovedAt: d.last_approved_at,
            nextRefillAt: d.next_refill_at,
            refillIntervalDays: d.refill_interval_days,
            doctor_id: d.doctor_id,
            created_at: d.created_at
          }));
          set({ orders: mappedOrders });
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
          const newTimeline = orderToUpdate ? [...orderToUpdate.timeline, { status: 'rx_sent', date: new Date().toLocaleString() }] : undefined;
          const currentUser = useAuthStore.getState().user;
          const doctorName = currentUser?.user_metadata?.first_name
            ? `Dr. ${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name}`
            : "Attending Physician";

          // 1. Update Order status
          const { error: orderError } = await supabase
            .from('orders')
            .update({
              status: 'rx_sent',
              medication: medication,
              dosage_instructions: dosage,
              doctor_note: note,
              doctor: doctorName,
              doctor_id: currentUser?.id,
              last_approved_at: new Date().toISOString(),
              ...(newTimeline && { timeline: newTimeline })
            })
            .eq('order_number', orderId);
            
          if (orderError) throw orderError;

          // 2. Create Prescription entry for Patient Portal
          if (orderToUpdate) {
            await supabase.from('prescriptions').insert([{
              patient_id: orderToUpdate.userId || orderToUpdate.user_id,
              doctor_id: currentUser?.id,
              medication: medication,
              dosage: dosage,
              frequency: note,
              status: 'active',
              refills_remaining: 5,
              pharmacy_name: orderToUpdate.pharmacy || "VIALSRX EXPRESS"
            }]);
          }

          await get().fetchOrders();
        } catch (error) {
          console.error("Failed to update rx:", error);
        }
      },

      approveRefill: async (orderId: string) => {
        try {
          const { error } = await supabase
            .from('orders')
            .update({
              status: 'rx_sent',
              doctor_id: useAuthStore.getState().user?.id,
              last_approved_at: new Date().toISOString()
            })
            .eq('order_number', orderId);
          if (error) throw error;
          await get().fetchOrders();
        } catch (error) {
          console.error("Failed to approve refill:", error);
        }
      },

      setIntakeFormData: (data) => set({ intakeFormData: data }),

      updateDoctorAvailability: async (doctorId, available) => {
        try {
          const { error } = await supabase
            .from('doctor_availability')
            .update({ available })
            .eq('id', doctorId);
          if (error) throw error;
          await get().fetchDoctorAvailability();
        } catch (error) {
          console.error('Error updating doctor availability:', error);
        }
      },

      resetStore: () => set({ orders: [], intakeFormData: {} }),
    })
  )
);
