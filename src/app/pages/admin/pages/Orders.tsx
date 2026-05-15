import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import {
  Truck,
  CheckCircle,
  Search,
  CloudDownload,
  RefreshCw,
  Filter,
  Package,
  ShieldCheck,
  Activity,
  Sparkles,
  ClipboardList,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { OrderStatus } from "../../../../lib/patient-store";
import { useAuthStore } from "../../../../lib/auth-store";
import { supabase } from "../../../../lib/supabaseClient";
import { ORDERS_ADMIN_NON_CLINICAL_SELECT, applyOrdersBrandScope } from "../../../../lib/adminScope";
import { logAdminAudit } from "../../../../lib/adminAudit";
import { toast } from "sonner";

const statusStyles: Record<OrderStatus, string> = {
  order_submitted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  account_created: "bg-slate-50 text-slate-500 border-slate-200",
  id_verified: "bg-teal-50 text-teal-800 border-teal-200",
  intake_completed: "bg-cyan-50 text-cyan-800 border-cyan-200",
  medical_review: "bg-amber-50 text-amber-800 border-amber-200",
  rx_sent: "bg-[#0A2E1F] text-white border-[#0A2E1F]",
  shipped: "bg-sky-50 text-sky-800 border-sky-200",
  delivered: "bg-violet-50 text-violet-800 border-violet-200",
  refill_eligible: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
};

const statusLabels: Record<OrderStatus, string> = {
  order_submitted: "Submitted",
  account_created: "Registered",
  id_verified: "Verified",
  intake_completed: "Intake",
  medical_review: "Clinical",
  rx_sent: "Prescribed",
  shipped: "Dispatched",
  delivered: "Delivered",
  refill_eligible: "Refill",
};

type StatusFilter =
  | "all"
  | "pending"
  | "rx_sent"
  | "shipped"
  | "delivered"
  | "other";

function parseAmount(o: any): number {
  const raw = o?.amount;
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  return parseFloat(String(raw ?? 0).replace(/[^0-9.-]+/g, "")) || 0;
}

export function AdminOrdersPage() {
  const { role, brandId } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({ patientName: "", medication: "", amount: "" });
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("USPS");
  const [pharmacyNote, setPharmacyNote] = useState("");
  const [searchQuery, setSearchQuery] = useState(qFromUrl);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    setSearchQuery(qFromUrl);
  }, [qFromUrl]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      let query = supabase
        .from("orders")
        .select(ORDERS_ADMIN_NON_CLINICAL_SELECT)
        .order("created_at", { ascending: false });

      query = applyOrdersBrandScope(query, role, brandId);

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [role, brandId]);

  const handleCreateManual = async () => {
    if (!newOrder.patientName || !newOrder.medication) return;
    try {
      const orderRef = "MAN-" + Math.random().toString(36).substring(7).toUpperCase();
      const { error } = await supabase.from("orders").insert([
        {
          order_number: orderRef,
          patient_name: newOrder.patientName,
          medication: newOrder.medication,
          amount: newOrder.amount || "0",
          sub_brand: brandId || "Peak Health",
          status: "order_submitted",
          ordered_date: new Date().toLocaleDateString(),
          timeline: [{ status: "order_submitted", date: new Date().toLocaleString() }],
        },
      ]);
      if (error) throw error;
      await logAdminAudit({
        action: "order.manual_create",
        targetType: "order",
        targetId: orderRef,
        detail: { patient: newOrder.patientName, medication: newOrder.medication },
      });
      toast.success("Order created", {
        description: `Reference ${orderRef} is in the queue.`,
      });
      setIsManualModalOpen(false);
      setNewOrder({ patientName: "", medication: "", amount: "" });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = async () => {
    const headers = "Order #,Patient,Medication,Status,Amount\n";
    const rows = orders
      .map(
        (o) =>
          `${o.order_number},${o.patient_name},${o.medication},${o.status},${o.amount}`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    await logAdminAudit({
      action: "order.export_csv",
      targetType: "orders",
      detail: { row_count: orders.length },
    });
    toast.info("CSV ready", {
      description: "Download should start automatically.",
    });
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("orders_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const handleMarkShipped = async (orderId: string) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      const newTimeline =
        order && order.timeline
          ? [...order.timeline, { status: "shipped", date: new Date().toLocaleDateString() }]
          : [{ status: "shipped", date: new Date().toLocaleDateString() }];

      await supabase
        .from("orders")
        .update({
          status: "shipped",
          tracking_number: trackingNumber,
          carrier: carrier,
          shipped_date: new Date().toLocaleDateString(),
          pharmacy_note: pharmacyNote,
          timeline: newTimeline,
        })
        .eq("id", orderId);

      await logAdminAudit({
        action: "order.mark_shipped",
        targetType: "order",
        targetId: order?.order_number || String(orderId),
        detail: { carrier, tracking: trackingNumber },
      });

      setEditingOrder(null);
      setTrackingNumber("");
      setPharmacyNote("");
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      const newTimeline =
        order && order.timeline
          ? [...order.timeline, { status: "delivered", date: new Date().toLocaleDateString() }]
          : [{ status: "delivered", date: new Date().toLocaleDateString() }];

      await supabase
        .from("orders")
        .update({
          status: "delivered",
          timeline: newTimeline,
        })
        .eq("id", orderId);

      await logAdminAudit({
        action: "order.mark_delivered",
        targetType: "order",
        targetId: order?.order_number || String(orderId),
      });

      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = orders;
    if (q) {
      list = list.filter(
        (o) =>
          String(o.patient_name ?? "").toLowerCase().includes(q) ||
          String(o.order_number ?? "").toLowerCase().includes(q) ||
          String(o.mrn ?? "").toLowerCase().includes(q) ||
          String(o.medication ?? "").toLowerCase().includes(q),
      );
    }
    if (statusFilter === "pending") {
      list = list.filter((o) => o.status === "order_submitted" || o.status === "medical_review");
    } else if (statusFilter === "rx_sent") {
      list = list.filter((o) => o.status === "rx_sent");
    } else if (statusFilter === "shipped") {
      list = list.filter((o) => o.status === "shipped");
    } else if (statusFilter === "delivered") {
      list = list.filter((o) => o.status === "delivered");
    } else if (statusFilter === "other") {
      list = list.filter(
        (o) =>
          ![
            "order_submitted",
            "medical_review",
            "rx_sent",
            "shipped",
            "delivered",
          ].includes(o.status),
      );
    }
    return list;
  }, [orders, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const n = orders.length;
    const pending = orders.filter(
      (o) => o.status === "order_submitted" || o.status === "medical_review",
    ).length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const revenue = orders.reduce((s, o) => s + parseAmount(o), 0);
    return { n, pending, shipped, delivered, revenue };
  }, [orders]);

  const syncSearchToUrl = () => {
    const q = searchQuery.trim();
    if (q) setSearchParams({ q });
    else setSearchParams({});
  };

  return (
    <div className="relative mx-auto max-w-[1600px] pb-12 text-[#0A0D14]">
      {/* Manual entry modal */}
      {isManualModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-order-title"
        >
          <Card className="relative w-full max-w-lg overflow-hidden border-0 shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-violet-500" />
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 ring-1 ring-emerald-200/80">
                    <Package className="h-7 w-7 text-emerald-700" />
                  </div>
                  <div>
                    <h2 id="manual-order-title" className="text-xl font-bold text-[#0A2E1F] sm:text-2xl">
                      Manual order
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">Creates a submitted row in your brand scope.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => setIsManualModalOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Patient name</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#0A2E1F] outline-none ring-emerald-500/0 transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
                    placeholder="Full name"
                    value={newOrder.patientName}
                    onChange={(e) => setNewOrder({ ...newOrder, patientName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Medication</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#0A2E1F] outline-none ring-emerald-500/0 transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-500/15"
                    placeholder="e.g. Semaglutide"
                    value={newOrder.medication}
                    onChange={(e) => setNewOrder({ ...newOrder, medication: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Amount (USD)</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#0A2E1F] outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/15"
                    placeholder="0"
                    type="number"
                    value={newOrder.amount}
                    onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-slate-200 text-sm font-semibold text-slate-600"
                  onClick={() => setIsManualModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="h-11 rounded-xl bg-gradient-to-r from-[#0A2E1F] to-emerald-800 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
                  onClick={handleCreateManual}
                >
                  Create order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hero */}
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-violet-50/50 p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-emerald-200/60">
              <ClipboardList className="h-7 w-7 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/80 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80">
                  Operations
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-sky-900 ring-1 ring-sky-200/70">
                  <Activity className="h-3 w-3" aria-hidden />
                  Live
                </span>
              </div>
              <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight text-[#0A2E1F] sm:text-3xl lg:text-4xl">
                Orders & fulfillment
              </h1>
              <p className="mt-2 max-w-xl text-pretty text-sm text-slate-600 sm:text-base">
                Search, filter, and update shipping for prescriptions in your brand. Export anytime for finance or QA.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-200 bg-white/80 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white"
              onClick={handleExportCSV}
            >
              <CloudDownload className="mr-2 h-4 w-4 text-emerald-600" />
              Export CSV
            </Button>
            <Button
              className="h-11 rounded-xl bg-gradient-to-r from-[#0A2E1F] to-emerald-800 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15"
              onClick={() => setIsManualModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Manual order
            </Button>
          </div>
        </div>

        {/* Inline KPIs */}
        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "In scope",
              value: stats.n.toLocaleString(),
              sub: "Orders loaded",
              tint: "from-emerald-500/10 to-teal-500/5 ring-emerald-200/50",
            },
            {
              label: "Needs review",
              value: stats.pending.toLocaleString(),
              sub: "Submitted + clinical",
              tint: "from-amber-500/15 to-orange-500/5 ring-amber-200/60",
            },
            {
              label: "Shipped",
              value: stats.shipped.toLocaleString(),
              sub: "In transit",
              tint: "from-sky-500/15 to-blue-500/5 ring-sky-200/60",
            },
            {
              label: "Revenue (sum)",
              value: `$${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              sub: `${stats.delivered} delivered`,
              tint: "from-violet-500/12 to-fuchsia-500/5 ring-violet-200/50",
            },
          ].map((k) => (
            <div
              key={k.label}
              className={cn(
                "rounded-2xl bg-gradient-to-br p-4 ring-1 backdrop-blur-[2px]",
                k.tint,
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#0A2E1F]">{k.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{k.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Toolbar + table */}
      <Card className="overflow-hidden border border-slate-200/90 shadow-md shadow-slate-200/40">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative min-w-0 flex-1 max-w-2xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={syncSearchToUrl}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  syncSearchToUrl();
                }
              }}
              placeholder="Search patient, order #, MRN, medication…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/0 transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-11 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
              >
                <option value="all">All statuses</option>
                <option value="pending">Needs review</option>
                <option value="rx_sent">Prescribed (ship)</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-50"
              onClick={() => fetchOrders()}
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loadingOrders && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingOrders && orders.length === 0 ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <Sparkles className="h-10 w-10 text-violet-400" />
              <p className="text-lg font-semibold text-slate-800">No orders match</p>
              <p className="max-w-md text-sm text-slate-500">
                {orders.length === 0
                  ? "No rows in your brand scope yet. Create a manual order or wait for new enrollments."
                  : "Try clearing search or setting the status filter to “All statuses.”"}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4 lg:px-6">Patient</th>
                  <th className="px-4 py-4">Brand</th>
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Ordered</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-5 py-4 text-right lg:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((item, rowIdx) => (
                  <tr
                    key={String(item.id ?? item.order_number ?? rowIdx)}
                    className="bg-white/80 transition-colors hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-transparent"
                  >
                    <td className="px-5 py-4 align-top lg:px-6">
                      <div className="font-semibold text-slate-900">
                        {item.patient_name || item.patientName}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono text-emerald-700">
                          {item.order_number ||
                            (item.id ? String(item.id).slice(0, 8) : "—")}
                        </span>
                        {item.mrn && (
                          <Badge className="border border-teal-200 bg-teal-50 px-2 py-0 text-[10px] font-semibold text-teal-800">
                            MRN {item.mrn}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {item.sub_brand || item.subBrand || "Peak Health"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-sm font-medium text-slate-900">{item.medication}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {item.pharmacy || "Pharmacy TBD"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      {item.ordered_date ||
                        item.orderedDate ||
                        (item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : "—")}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                          statusStyles[item.status as OrderStatus] ||
                            "border-slate-200 bg-slate-100 text-slate-600",
                        )}
                      >
                        {statusLabels[item.status as OrderStatus] ||
                          String(item.status || "").replace(/_/g, " ")}
                      </span>
                      {item.pharmacy_note && (
                        <div className="mt-2 max-w-[200px] rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-900">
                          {item.pharmacy_note}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right align-top lg:px-6">
                      <div className="flex flex-col items-end gap-2">
                        {item.status === "rx_sent" && editingOrder !== item.id && (
                          <Button
                            className="h-9 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-700 px-4 text-xs font-semibold text-white shadow-md"
                            onClick={() => setEditingOrder(item.id)}
                          >
                            <Truck className="mr-2 h-3.5 w-3.5" />
                            Add tracking
                          </Button>
                        )}

                        {editingOrder === item.id && (
                          <div className="w-full max-w-[min(100%,380px)] rounded-2xl border border-emerald-200 bg-gradient-to-b from-white to-emerald-50/40 p-5 text-left shadow-lg ring-1 ring-emerald-100/80">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                              Dispatch
                            </p>
                            <p className="text-[11px] text-slate-500">Carrier, tracking, optional pharmacy note.</p>
                            <div className="mt-4 grid grid-cols-3 gap-2">
                              <select
                                className="col-span-1 rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-400"
                                value={carrier}
                                onChange={(e) => setCarrier(e.target.value)}
                              >
                                <option>USPS</option>
                                <option>FedEx</option>
                                <option>UPS</option>
                                <option>DHL</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Tracking #"
                                className="col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-sky-400"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                              />
                            </div>
                            <textarea
                              placeholder="Internal note (optional)"
                              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-300"
                              rows={3}
                              value={pharmacyNote}
                              onChange={(e) => setPharmacyNote(e.target.value)}
                            />
                            <div className="mt-4 flex gap-2">
                              <Button
                                className="h-10 flex-1 rounded-xl bg-[#0A2E1F] text-xs font-semibold text-white"
                                onClick={() => handleMarkShipped(item.id)}
                              >
                                Mark shipped
                              </Button>
                              <Button
                                variant="outline"
                                className="h-10 flex-1 rounded-xl border-slate-200 text-xs font-semibold text-slate-600"
                                onClick={() => {
                                  setEditingOrder(null);
                                  setTrackingNumber("");
                                  setPharmacyNote("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {item.status === "shipped" && (
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right text-[11px] text-slate-500">
                              <span className="font-semibold text-sky-700">{item.carrier}</span>
                              <span className="mx-1">·</span>
                              <span className="font-mono text-slate-800">
                                {item.tracking_number || item.tracking || "—"}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 rounded-xl border-violet-200 bg-violet-50/50 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                              onClick={() => handleMarkDelivered(item.id)}
                            >
                              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                              Mark delivered
                            </Button>
                          </div>
                        )}

                        {item.status === "delivered" && (
                          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Delivered
                          </div>
                        )}

                        {item.status === "order_submitted" && (
                          <span className="text-[11px] font-medium text-slate-400">Awaiting clinical</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Trust strip — lightweight, non-fake metrics */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Card className="border border-emerald-100/80 bg-emerald-50/30 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-[#0A2E1F]">HIPAA-aware session</p>
              <p className="text-xs text-slate-600">Actions are written to the admin audit log when available.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-sky-100/80 bg-sky-50/25 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Activity className="h-8 w-8 shrink-0 text-sky-600" />
            <div>
              <p className="text-sm font-semibold text-[#0A2E1F]">Realtime refresh</p>
              <p className="text-xs text-slate-600">Table syncs when the orders table changes in Supabase.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-violet-100/80 bg-violet-50/25 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <Package className="h-8 w-8 shrink-0 text-violet-700" />
            <div>
              <p className="text-sm font-semibold text-[#0A2E1F]">Scoped to your brand</p>
              <p className="text-xs text-slate-600">Rows respect brand admin visibility rules from the server.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
