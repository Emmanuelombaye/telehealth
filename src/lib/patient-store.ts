import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Centralized reactive Zustand store for the global state (Patient/Doctor/Admin).
// Source of truth for: brand config, active order pipeline, doctor availability.
// Uses local storage persist to simulate a real backend flow between portals.

export type OrderStatus =
  | "order_submitted"
  | "doctor_reviewing"
  | "rx_sent"
  | "shipped"
  | "delivered";

export const ORDER_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "order_submitted", label: "Order Submitted", desc: "Health questionnaire received by our clinical team" },
  { key: "doctor_reviewing", label: "Doctor Reviewing", desc: "A physician is reviewing your medical profile" },
  { key: "rx_sent", label: "Prescription Sent", desc: "Prescription approved and sent to pharmacy" },
  { key: "shipped", label: "Shipped", desc: "Medication shipped" },
  { key: "delivered", label: "Delivered", desc: "Medication delivered" },
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
};

// Removed mock initialOrders to enforce strict backend data fetching

export function getStepIndex(status: OrderStatus) {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

export function getActiveOrder(orders: Order[]) {
  return orders.find((o) => o.status !== "shipped" && o.status !== "delivered") ?? orders[0];
}

export function getAwaitingReviewCount(orders: Order[]) {
  return orders.filter((o) => o.status === "order_submitted" || o.status === "doctor_reviewing").length;
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
  wait: string;
  nextSlot: string;
};

export const doctorAvailability: DoctorAvailability[] = [
  { id: 1, name: "Dr. Sarah Johnson", specialty: "General Practice", avatar: "SJ", available: true, wait: "< 5 min", nextSlot: "Available now" },
  { id: 2, name: "Dr. Michael Chen", specialty: "Cardiology", avatar: "MC", available: true, wait: "< 15 min", nextSlot: "Today 11:00 AM" },
  { id: 3, name: "Dr. Amira Hassan", specialty: "Dermatology", avatar: "AH", available: false, wait: "Async only", nextSlot: "Tomorrow 9:00 AM" },
  { id: 4, name: "Dr. Carlos Rivera", specialty: "Endocrinology", avatar: "CR", available: true, wait: "< 30 min", nextSlot: "Today 2:30 PM" },
];

export const brand = {
  name: "Peak Health",
  shortName: "Peak",
  domain: "peakhealth.com",
  supportEmail: "support@peakhealth.com",
  tagline: "Global TeleHealth, HIPAA-compliant",
};

interface AppState {
  orders: Order[];
  doctorAvailability: DoctorAvailability[];
  intakeFormData: Record<string, any>;
  fetchOrders: () => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, tracking?: string, carrier?: string) => Promise<void>;
  updateOrderRx: (orderId: string, medication: string, dosage: string, note: string) => Promise<void>;
  setIntakeFormData: (data: Record<string, any>) => void;
  updateDoctorAvailability: (doctorId: number, available: boolean) => void;
  resetStore: () => void;
}

import { supabase } from './supabaseClient';
import { useAuthStore } from './auth-store';
import { PharmacyService } from '../api/pharmacy';

export const usePatientStore = create<AppState>()(
  devtools(
    (set, get) => ({
      orders: [], // Start fresh
      doctorAvailability: doctorAvailability,
      intakeFormData: {},

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
          if (error) throw error;
          
          const mappedOrders: Order[] = (data || []).map(d => ({
            id: d.order_number,
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
            waitMins: d.wait_mins,
            time: d.time,
            mrn: d.mrn
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
            mrn: order.mrn,
            timeline: order.timeline
          }]);
        } catch (error) {
          console.error('Error adding order to Supabase:', error);
        }
      },

      updateOrderStatus: async (orderId: string, status: OrderStatus, tracking?: string, carrier?: string) => {
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
                  timeline: newTimeline
                }
              : order
          )
        }));

        try {
          await supabase.from('orders').update({
            status,
            ...(tracking && { tracking }),
            ...(carrier && { carrier }),
            timeline: newTimeline
          }).eq('order_number', orderId);
        } catch (error) {
          console.error('Error updating order status in Supabase:', error);
        }
      },
        
      updateOrderRx: async (orderId: string, medication: string, dosage: string, note: string) => {
        try {
          const { error } = await supabase
            .from('orders')
            .update({
              status: 'rx_sent',
              medication: medication,
              dosage_instructions: dosage,
              doctor_note: note
            })
            .eq('order_number', orderId);
            
          if (error) throw error;
          
          await get().fetchOrders(); // Refresh local state
          
          // trigger automated pharmacy fulfillment!
          PharmacyService.simulateFulfillment(orderId, medication);
          
        } catch (error) {
          console.error("Failed to update rx:", error);
        }
      },

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
        
      resetStore: () => set({ orders: initialOrders, intakeFormData: {} }),
    })
  )
);
