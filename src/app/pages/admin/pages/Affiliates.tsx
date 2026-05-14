import { useCallback, useEffect, useMemo, useState } from "react";
import { Share2, Plus, Users, RefreshCw, ShieldAlert } from "lucide-react";
import { Card, CardContent, Button } from "../../../components/ui/shared.tsx";
import { AdminDataTable, StatusText } from "../../../components/ui/tables/AdminDataTable";
import { useAuthStore } from "../../../../lib/auth-store";
import { supabase } from "../../../../lib/supabaseClient";
import { cn } from "../../../components/ui/utils";

type AffiliateRow = {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  referral_code: string;
  status: string;
  commission_rate: number | null;
  balance: number | null;
  total_earned: number | null;
  created_at: string;
  referrals?: { count: number }[] | null;
};

function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n));
}

export function AdminAffiliatesPage() {
  const role = useAuthStore((s) => s.role);
  const isSuper = role === "super_admin";

  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSuper) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nested = await supabase
        .from("affiliates")
        .select("id, full_name, email, company_name, referral_code, status, commission_rate, balance, total_earned, created_at, referrals(count)")
        .order("created_at", { ascending: false });

      if (nested.error) {
        const msg = nested.error.message || "";
        if (nested.error.code === "42P01" || msg.includes("does not exist")) {
          setError(
            "The affiliates table is not installed. Run supabase_affiliate_system.sql in the Supabase SQL editor, then refresh.",
          );
          setRows([]);
          return;
        }
        const simple = await supabase
          .from("affiliates")
          .select("id, full_name, email, company_name, referral_code, status, commission_rate, balance, total_earned, created_at")
          .order("created_at", { ascending: false });
        if (simple.error) throw simple.error;
        setRows((simple.data || []) as AffiliateRow[]);
        return;
      }
      setRows((nested.data || []) as AffiliateRow[]);
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : String(e);
      setError(m);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [isSuper]);

  useEffect(() => {
    void load();
  }, [load]);

  const tableData = useMemo(
    () =>
      rows.map((r) => {
        const refCount =
          Array.isArray(r.referrals) && r.referrals[0] && typeof r.referrals[0].count === "number"
            ? r.referrals[0].count
            : null;
        const rate = r.commission_rate != null ? `${Number(r.commission_rate)}%` : "—";
        return {
          id: r.id,
          name: r.full_name,
          contact: r.email,
          company: r.company_name || "—",
          code: r.referral_code,
          referrals: refCount ?? "—",
          revenue: formatMoney(r.total_earned),
          commission: formatMoney(r.balance),
          rate,
          status: r.status,
        };
      }),
    [rows],
  );

  if (!isSuper) {
    return (
      <div className="max-w-[1500px] mx-auto font-sans space-y-6">
        <h1 className="text-2xl font-semibold">Affiliates</h1>
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-6 flex gap-4 items-start">
            <ShieldAlert className="h-6 w-6 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Platform-level directory</p>
              <p className="text-sm text-amber-900/80 mt-1">
                Partner and affiliate accounts are visible to platform super administrators only. Brand operators manage
                fulfillment from <span className="font-mono text-xs">/admin/orders</span> and related tools.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto font-sans space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Affiliates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live directory from <code className="text-xs bg-muted px-1 rounded">public.affiliates</code> (RLS: super
            admin read).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg gap-2 h-9" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" className="rounded-lg gap-1.5 h-9 px-4 text-[13px]" disabled>
            <Plus className="h-4 w-4" />
            Add Partner
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 text-sm text-red-900">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && rows.length === 0 && (
        <Card>
          <CardContent className="p-8 flex flex-col items-center text-center gap-2">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No affiliate profiles yet</p>
            <p className="text-sm text-muted-foreground max-w-md">
              After you run <code className="text-xs bg-muted px-1 rounded">supabase_affiliate_system.sql</code>, create
              users with role <code className="text-xs bg-muted px-1 rounded">affiliate</code> and matching rows in{" "}
              <code className="text-xs bg-muted px-1 rounded">affiliates</code>.
            </p>
          </CardContent>
        </Card>
      )}

      {(loading || rows.length > 0) && (
        <>
          {loading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Loading affiliates…
            </p>
          )}
          {!loading && (
        <AdminDataTable
          data={tableData}
          columns={[
            {
              header: "Partner",
              accessorKey: "name",
              cell: (item: (typeof tableData)[0]) => (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                    {String(item.name)
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{item.contact}</span>
                  </div>
                </div>
              ),
            },
            { header: "Company", accessorKey: "company", cell: (item: (typeof tableData)[0]) => <span className="text-sm">{item.company}</span> },
            { header: "Code", accessorKey: "code", cell: (item: (typeof tableData)[0]) => <span className="font-mono text-xs">{item.code}</span> },
            {
              header: "Referrals",
              accessorKey: "referrals",
              cell: (item: (typeof tableData)[0]) => <span className="font-medium">{item.referrals}</span>,
            },
            {
              header: "Lifetime earned",
              accessorKey: "revenue",
              cell: (item: (typeof tableData)[0]) => <span className="text-emerald-600 font-semibold">{item.revenue}</span>,
            },
            {
              header: "Balance",
              accessorKey: "commission",
              cell: (item: (typeof tableData)[0]) => (
                <span className="text-amber-600 font-semibold">
                  {item.commission} <span className="text-muted-foreground font-normal text-xs">({item.rate})</span>
                </span>
              ),
            },
            {
              header: "Status",
              accessorKey: "status",
              cell: (item: (typeof tableData)[0]) => (
                <StatusText
                  status={
                    item.status === "active" ? "Active" : item.status === "pending" ? "Pending" : item.status === "suspended" ? "Suspended" : "Archived"
                  }
                />
              ),
            },
          ]}
          searchPlaceholder="Search partners by name or email"
        />
          )}
        </>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Share2 className="h-3.5 w-3.5" />
        <span>
          Deploy database policies from <code className="bg-muted px-1 rounded">supabase/migrations/20260514143000_production_core_rbac.sql</code> so
          audit and row-level access match production.
        </span>
      </div>
    </div>
  );
}
