import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Calendar, Clock, FileText, Activity, MessageSquare, Plus,
  Droplets, Heart, ChevronRight, Video, Pill, Stethoscope,
  ShieldCheck, TrendingUp, Truck, CheckCircle2, Package, ShoppingBag, Hourglass, Building2, Copy
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, cn } from "../../components/ui/shared.tsx";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  useI18n,
  ORDER_STEPS, getStepIndex, usePatientStore, useAuthStore
} from "../../../lib";
import { supabase } from "../../../lib/supabaseClient";

const stepIcon: Record<string, any> = {
  order_submitted: FileText,
  doctor_reviewing: Stethoscope,
  rx_sent: Pill,
  shipped: Package,
  delivered: Truck,
};

const subBrandTint: Record<string, string> = {
  GlowRx: "bg-[var(--brand-peach-100)] text-[var(--brand-peach-900)]",
  VitalCare: "bg-[var(--brand-sage-100)] text-[var(--brand-sage-900)]",
  PeakHealth: "bg-[var(--brand-lavender-100)] text-[var(--brand-lavender-900)]",
};

// Removed mock health data to ensure production data integrity

export function PatientDashboard() {
  const { t } = useI18n();
  const user = useAuthStore(state => state.user);
  const doctorAvailability = usePatientStore(state => state.doctorAvailability);
  const firstName = user?.user_metadata?.first_name || 'Patient';
  const availableDoctors = doctorAvailability.filter(d => d.available);

  const { orders, fetchOrders } = usePatientStore();
  
  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id, fetchOrders]);

  const awaitingReview = orders.filter(o => o.status === "order_submitted").length;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Welcome header */}
      <div className="flex items-start justify-between pt-1 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold">Welcome, {firstName}</h1>
            {orders[0]?.mrn && (
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                MRN: {orders[0].mrn}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Here's the status of your prescriptions and consultations.
          </p>
        </div>
        <Link to="/patient/appointments">
          <Button className="rounded-full h-10 px-4 shadow-md shadow-primary/20 text-sm gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("action.bookVisit")}</span>
          </Button>
        </Link>
      </div>

      {/* Awaiting-review banner */}
      {awaitingReview > 0 && (
        <div className="flex items-center gap-3 bg-[var(--brand-peach-50)] border border-[var(--brand-peach-300)] rounded-2xl px-4 py-3">
          <Hourglass className="h-4 w-4 text-[var(--brand-peach-900)] shrink-0" />
          <p className="text-sm text-[var(--brand-peach-900)] font-medium">
            You have {awaitingReview} consultation{awaitingReview > 1 ? "s" : ""} awaiting doctor review.
          </p>
        </div>
      )}

      {/* Prescriptions & consultations list */}
      <div className="space-y-3">
        {orders.map(order => {
          const currentIdx = getStepIndex(order.status);
          const tint = subBrandTint[order.subBrand] ?? subBrandTint.PeakHealth;
          const statusLabel = ORDER_STEPS[currentIdx]?.label ?? "Processing";

          return (
            <Link key={order.id} to="/patient/orders" className="block">
              <Card className="hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full", tint)}>
                      {order.subBrand}
                    </span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{statusLabel}</Badge>
                  </div>
                  <p className="font-bold text-sm">{order.medication}</p>
                  <p className="text-xs text-muted-foreground">{order.dosageInstructions}</p>
                  
                  {order.doctor && order.doctor !== "Pending assignment" && (
                    <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg w-fit">
                      <Stethoscope className="h-3 w-3 text-blue-600" />
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-tight">Assigned: {order.doctor}</span>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-muted/30 rounded-2xl border border-border/40">
                     <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Current Progress</p>
                     <p className="text-xs font-medium text-foreground leading-relaxed">{ORDER_STEPS[currentIdx]?.desc || "Processing your request..."}</p>
                  </div>

                  {/* 5-step horizontal pipeline */}
                  <div className="mt-4 flex items-start gap-1">
                    {ORDER_STEPS.map((step, i) => {
                      const Icon = stepIcon[step.key];
                      const done = i <= currentIdx;
                      const active = i === currentIdx;
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center gap-1 relative">
                          <div className="flex items-center w-full">
                            <div className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : done ? "bg-primary" : "bg-border")} />
                            <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all",
                              done ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                              active && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background")}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className={cn("h-0.5 flex-1", i === ORDER_STEPS.length - 1 ? "opacity-0" : i < currentIdx ? "bg-primary" : "bg-border")} />
                          </div>
                          <span className={cn("text-[9px] font-semibold text-center leading-tight",
                            active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>
                            {step.label}
                            {active && <span className="block text-[8px] font-bold text-primary">Current</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Meta row */}
                  <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ordered</p>
                      <p className="font-semibold">{order.orderedDate}</p>
                    </div>
                    {order.tracking && (
                      <div className="col-span-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tracking</p>
                        <div className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-mono font-semibold truncate">{order.tracking}</span>
                          <Copy className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Doctor Availability strip */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm">Doctors available now</h2>
          <Link to="/patient/appointments" className="text-xs text-primary font-semibold">{t("action.viewAll")}</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {availableDoctors.map(doc => (
            <Link key={doc.id} to="/patient/appointments" className="shrink-0">
              <div className="w-40 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="relative h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                    {doc.avatar}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--brand-sage-300)] border-2 border-card" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{doc.specialty}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[var(--brand-sage-900)] font-semibold">● {doc.wait}</p>
                <p className="text-[10px] text-muted-foreground">{doc.nextSlot}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Empty State / Welcome to Peak Health */}
      {orders.length === 0 && (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="p-10 text-center">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Ready to start your health journey?</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              You haven't placed any orders yet. Visit our dispensary to find the right treatment for you.
            </p>
            <Link to="/patient/shop" className="inline-block mt-6">
              <Button className="rounded-xl h-12 px-8 font-bold gap-2">
                Browse Treatments <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Identity status */}
      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{t("label.identityVerified")}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Secure HIPAA Infrastructure · Peak Health</p>
          </div>
        </CardContent>
      </Card>

      {/* Bottom spacer for nav */}
      <div className="h-4" />
    </div>
  );
}
