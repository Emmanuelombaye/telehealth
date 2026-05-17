import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Video, RefreshCw, Zap, Shield, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input, cn } from "../ui/shared.tsx";
import { supabase } from "../../../lib/supabaseClient";
import type { ConsultRoutingRuleRow } from "../../../lib/videoConsultRules";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const emptyForm = {
  label: "",
  priority: "100",
  match_states: "",
  match_categories: "",
  match_product_ids: "",
  bmi_min: "",
  age_min: "",
  requires_sync_video: true,
  active: true,
};

export function ConsultRoutingRulesPanel({ productOptions }: { productOptions: { id: string; name: string }[] }) {
  const [rules, setRules] = useState<ConsultRoutingRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("consult_routing_rules")
        .select("*")
        .order("priority", { ascending: true });
      if (err) throw err;
      setRules((data || []) as ConsultRoutingRuleRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load routing rules.");
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const states = form.match_states
        .split(/[,;\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter((s) => /^[A-Z]{2}$/.test(s));
      const categories = form.match_categories
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const productIds = form.match_product_ids
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const clinical_json: Record<string, unknown> = {};
      if (form.bmi_min.trim()) clinical_json.bmi_min = Number(form.bmi_min);
      if (form.age_min.trim()) clinical_json.age_min = Number(form.age_min);

      const row = {
        label: form.label.trim() || null,
        priority: Number(form.priority) || 100,
        active: form.active,
        match_states: states.length ? states : null,
        match_categories: categories.length ? categories : null,
        match_product_ids: productIds.length ? productIds : null,
        requires_sync_video: form.requires_sync_video,
        clinical_json: Object.keys(clinical_json).length ? clinical_json : null,
      };

      const { error: err } = await supabase.from("consult_routing_rules").insert([row]);
      if (err) throw new Error(`${err.message} ${err.details || ""}`);

      toast.success("Routing rule saved", { description: form.label || "New global rule is now active." });
      setForm(emptyForm);
      setShowForm(false);
      await fetchRules();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Save failed.";
      setError(msg);
      toast.error("Save failed", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rule: ConsultRoutingRuleRow) {
    setTogglingId(rule.id);
    const { error: err } = await supabase
      .from("consult_routing_rules")
      .update({ active: !rule.active })
      .eq("id", rule.id);
    if (err) {
      toast.error("Update failed", { description: err.message });
    } else {
      toast.success(rule.active ? "Rule disabled" : "Rule enabled");
    }
    setTogglingId(null);
    await fetchRules();
  }

  async function deleteRule(id: string, label: string) {
    if (!confirm(`Delete rule "${label || "Unlabeled rule"}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const { error: err } = await supabase.from("consult_routing_rules").delete().eq("id", id);
    if (err) {
      toast.error("Delete failed", { description: err.message });
    } else {
      toast.success("Rule deleted");
    }
    setDeletingId(null);
    await fetchRules();
  }

  const activeCount = rules.filter((r) => r.active).length;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.03]">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/[0.07] via-transparent to-emerald-500/[0.04]" aria-hidden />
        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 shadow-md shadow-violet-900/20">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-600">Cross-product routing rules</span>
                {!loading && (
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                    activeCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", activeCount > 0 ? "bg-emerald-500" : "bg-slate-400")} />
                    {activeCount} active
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">Global Path A triggers</h2>
              <p className="mt-0.5 max-w-xl text-xs font-medium leading-relaxed text-slate-500">
                Rules applied at enrollment by state, category, product, BMI or age. Lower priority number runs first.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-10 rounded-xl border-slate-200 p-0"
              onClick={() => void fetchRules()}
            >
              <RefreshCw className={cn("h-4 w-4 text-slate-500", loading && "animate-spin")} />
            </Button>
            <Button
              type="button"
              className="h-10 gap-2 rounded-xl bg-[#0A2E1F] px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-emerald-950"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? "Cancel" : "Add rule"}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-7 space-y-4">
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Add Rule Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSave}
              className="rounded-2xl border border-violet-200/80 bg-violet-50/40 p-6 space-y-5 shadow-sm"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-600">New Routing Rule</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rule label</label>
                  <Input
                    placeholder="e.g. GLP-1 + CA + BMI ≥ 40 → video required"
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    className="h-11 rounded-xl border-slate-200 font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Priority</label>
                  <Input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="h-11 rounded-xl border-slate-200 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Lower number = runs first</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Match states</label>
                  <Input
                    placeholder="CA, NY, TX"
                    value={form.match_states}
                    onChange={(e) => setForm((f) => ({ ...f, match_states: e.target.value }))}
                    className="h-11 rounded-xl border-slate-200 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Match categories</label>
                  <Input
                    placeholder="Weight Loss, Hair Loss"
                    value={form.match_categories}
                    onChange={(e) => setForm((f) => ({ ...f, match_categories: e.target.value }))}
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">BMI ≥ triggers</label>
                  <Input
                    type="number"
                    placeholder="40"
                    value={form.bmi_min}
                    onChange={(e) => setForm((f) => ({ ...f, bmi_min: e.target.value }))}
                    className="h-11 rounded-xl border-slate-200 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Age ≥ triggers</label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={form.age_min}
                    onChange={(e) => setForm((f) => ({ ...f, age_min: e.target.value }))}
                    className="h-11 rounded-xl border-slate-200 font-mono"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Match product IDs (optional)</label>
                  <Input
                    placeholder="uuid, uuid…"
                    value={form.match_product_ids}
                    onChange={(e) => setForm((f) => ({ ...f, match_product_ids: e.target.value }))}
                    className="h-11 rounded-xl border-slate-200 font-mono text-xs"
                  />
                  {productOptions.length > 0 && (
                    <p className="text-[10px] font-medium text-slate-400">
                      Products: {productOptions.map((p) => `${p.name.slice(0, 18)} (${p.id.slice(0, 8)})`).join(" · ")}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-violet-200 bg-white p-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-violet-600"
                  checked={form.requires_sync_video}
                  onChange={(e) => setForm((f) => ({ ...f, requires_sync_video: e.target.checked }))}
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">Requires sync video (Path A) when rule matches</p>
                  <p className="text-[11px] text-slate-500">Patient will be routed to a live video consultation</p>
                </div>
              </label>

              <Button
                type="submit"
                disabled={saving}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 font-black uppercase tracking-widest text-[10px] text-white shadow-lg transition hover:brightness-105"
              >
                {saving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Save routing rule to database"}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Rules List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading rules…</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Zap className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-500">No global rules yet</p>
            <p className="max-w-xs text-xs text-slate-400 leading-relaxed">
              Product-level Path A/B is set per protocol above. Add rules here for cross-product logic (e.g. all GLP-1 in CA with BMI ≥ 40).
            </p>
            <Button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-1 h-9 gap-1.5 rounded-xl bg-violet-600 px-5 text-[10px] font-black uppercase tracking-widest text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add first rule
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {rules.map((rule, i) => (
              <motion.li
                key={rule.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "group flex flex-col gap-3 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between",
                  rule.active
                    ? "border-slate-200 bg-white shadow-sm hover:border-violet-200 hover:shadow-md"
                    : "border-slate-100 bg-slate-50/60 opacity-60",
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                    rule.active ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-400"
                  )}>
                    {rule.active ? <CheckCircle2 className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">{rule.label || "Unlabeled rule"}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        Priority {rule.priority}
                      </span>
                      {rule.match_states?.length ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                          States: {rule.match_states.join(", ")}
                        </span>
                      ) : null}
                      {rule.match_categories?.length ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {rule.match_categories.join(", ")}
                        </span>
                      ) : null}
                      {rule.clinical_json?.bmi_min != null ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          BMI ≥ {rule.clinical_json.bmi_min}
                        </span>
                      ) : null}
                      {rule.clinical_json?.age_min != null ? (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          Age ≥ {rule.clinical_json.age_min}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={togglingId === rule.id}
                    className={cn(
                      "h-9 rounded-xl text-[10px] font-black uppercase tracking-widest",
                      rule.active
                        ? "border-slate-200 text-slate-600 hover:border-slate-300"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    )}
                    onClick={() => void toggleActive(rule)}
                  >
                    {togglingId === rule.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : rule.active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deletingId === rule.id}
                    className="h-9 w-9 rounded-xl border-red-100 p-0 text-red-500 hover:border-red-300 hover:bg-red-50"
                    onClick={() => void deleteRule(rule.id, rule.label || "")}
                  >
                    {deletingId === rule.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
