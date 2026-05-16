import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Video, RefreshCw } from "lucide-react";
import { Button, Input, cn } from "../ui/shared.tsx";
import { supabase } from "../../../lib/supabaseClient";
import type { ConsultRoutingRuleRow } from "../../../lib/videoConsultRules";
import { motion, AnimatePresence } from "framer-motion";

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
      if (err) {
        console.error("Supabase insert error:", err);
        throw new Error(`${err.message} ${err.details || ""}`);
      }
      setForm(emptyForm);
      setShowForm(false);
      await fetchRules();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Save failed — check super_admin role.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rule: ConsultRoutingRuleRow) {
    const { error: err } = await supabase
      .from("consult_routing_rules")
      .update({ active: !rule.active })
      .eq("id", rule.id);
    if (err) {
      setError(err.message);
      return;
    }
    await fetchRules();
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this routing rule?")) return;
    const { error: err } = await supabase.from("consult_routing_rules").delete().eq("id", id);
    if (err) {
      setError(err.message);
      return;
    }
    await fetchRules();
  }

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-lg ring-1 ring-slate-900/5 backdrop-blur-sm overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/80 via-white to-emerald-50/60 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-700">
            <Video className="h-3.5 w-3.5" />
            Cross-product routing rules
          </div>
          <h2 className="mt-1 text-lg font-black text-slate-900">Global Path A triggers</h2>
          <p className="mt-1 max-w-xl text-xs font-medium text-slate-500 leading-relaxed">
            Optional rules applied at enrollment (state, category, product IDs, BMI/age). Questionnaire answers are
            never used. Lower priority number runs first.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => void fetchRules()}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] uppercase tracking-widest"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add rule
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</p>
        ) : null}

        <AnimatePresence>
          {showForm ? (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSave}
              className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5 space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Label</label>
                  <Input
                    placeholder="e.g. GLP-1 + CA + BMI 40"
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</label>
                  <Input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match states</label>
                  <Input
                    placeholder="CA, NY"
                    value={form.match_states}
                    onChange={(e) => setForm((f) => ({ ...f, match_states: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match categories</label>
                  <Input
                    placeholder="Weight Loss"
                    value={form.match_categories}
                    onChange={(e) => setForm((f) => ({ ...f, match_categories: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Match product IDs (optional)
                  </label>
                  <Input
                    placeholder="uuid, uuid…"
                    value={form.match_product_ids}
                    onChange={(e) => setForm((f) => ({ ...f, match_product_ids: e.target.value }))}
                    className="rounded-xl font-mono text-xs"
                  />
                  {productOptions.length > 0 ? (
                    <p className="text-[10px] text-slate-500">
                      Catalog IDs: {productOptions.map((p) => `${p.name.slice(0, 12)}… (${p.id.slice(0, 8)})`).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">BMI ≥</label>
                  <Input
                    type="number"
                    placeholder="40"
                    value={form.bmi_min}
                    onChange={(e) => setForm((f) => ({ ...f, bmi_min: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age ≥</label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={form.age_min}
                    onChange={(e) => setForm((f) => ({ ...f, age_min: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-violet-600"
                  checked={form.requires_sync_video}
                  onChange={(e) => setForm((f) => ({ ...f, requires_sync_video: e.target.checked }))}
                />
                Requires sync video (Path A) when rule matches
              </label>
              <Button
                type="submit"
                disabled={saving}
                className="h-11 w-full rounded-xl bg-violet-600 font-black uppercase tracking-widest text-[10px] text-white"
              >
                {saving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Save routing rule"}
              </Button>
            </motion.form>
          ) : null}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : rules.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
            No global rules yet. Product-level Path A/B is set per protocol above; add rules here for cross-product
            logic (e.g. all GLP-1 in CA with BMI ≥ 40).
          </p>
        ) : (
          <ul className="space-y-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                  rule.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-70",
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{rule.label || "Unlabeled rule"}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Priority {rule.priority}
                    {rule.match_states?.length ? ` · States: ${rule.match_states.join(", ")}` : ""}
                    {rule.match_categories?.length ? ` · ${rule.match_categories.join(", ")}` : ""}
                    {rule.clinical_json?.bmi_min != null ? ` · BMI≥${rule.clinical_json.bmi_min}` : ""}
                    {rule.clinical_json?.age_min != null ? ` · Age≥${rule.clinical_json.age_min}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="outline" className="h-9 rounded-lg text-xs" onClick={() => void toggleActive(rule)}>
                    {rule.active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg text-xs text-red-600 border-red-200"
                    onClick={() => void deleteRule(rule.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
