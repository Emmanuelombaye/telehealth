import { useState, useEffect } from "react";
import {
  FileCheck, Clock, CheckCircle2, ChevronRight,
  Loader2, ShieldCheck, ArrowRight,
  FileText, Lock, ArrowLeft, Send,
} from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { usePatientStore } from "../../../../lib/patient-store";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
type VisitForm = {
  id: string;
  patient_id: string;
  title: string;
  visit_name: string | null;
  status: "pending" | "completed" | "in-progress";
  urgent: boolean;
  form_data: Record<string, any>;
  created_at: string;
};

// A question inside form_data.questions (doctor-assigned) or a generic fallback
type FormQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio" | "yesno";
  options?: string[];
  required?: boolean;
};

// Generic fallback questions used when the doctor hasn't pre-defined any
const GENERIC_QUESTIONS: FormQuestion[] = [
  { id: "chief_complaint", label: "What is your main reason for this visit?", type: "textarea", required: true },
  { id: "symptoms_duration", label: "How long have you had these symptoms?", type: "select", options: ["Less than 24 hours", "1–3 days", "4–7 days", "1–2 weeks", "More than 2 weeks"], required: true },
  { id: "pain_level", label: "Rate your discomfort level (0 = none, 10 = severe)", type: "select", options: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
  { id: "medications_taken", label: "Have you taken any medications for this issue?", type: "yesno" },
  { id: "medications_detail", label: "If yes, which medications?", type: "text" },
  { id: "allergies_update", label: "Any new allergies since your last visit?", type: "yesno" },
  { id: "additional_notes", label: "Anything else you'd like your doctor to know?", type: "textarea" },
];

function resolveQuestions(form: VisitForm): FormQuestion[] {
  const q = form.form_data?.questions;
  if (Array.isArray(q) && q.length > 0) return q as FormQuestion[];
  return GENERIC_QUESTIONS;
}

// ── FormViewer — renders and submits a single visit form ─────────────────────
function FormViewer({
  form,
  readOnly,
  onBack,
  onSubmitted,
}: {
  form: VisitForm;
  readOnly: boolean;
  onBack: () => void;
  onSubmitted: (updated: VisitForm) => void;
}) {
  const { user } = useAuthStore();
  const questions = resolveQuestions(form);

  // Pre-fill with existing answers if any
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const saved = form.form_data?.answers;
    return saved && typeof saved === "object" ? saved : {};
  });
  const [submitting, setSubmitting] = useState(false);

  const setAnswer = (id: string, val: string) =>
    setAnswers((prev) => ({ ...prev, [id]: val }));

  const handleSubmit = async () => {
    if (!user) return;
    // Check required fields
    const missing = questions.filter((q) => q.required && !answers[q.id]?.trim());
    if (missing.length > 0) {
      toast.error(`Please answer: ${missing.map((q) => q.label).join(", ")}`);
      return;
    }
    setSubmitting(true);
    try {
      const newFormData = {
        ...form.form_data,
        answers,
        submitted_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("visit_forms")
        .update({
          status: "completed",
          form_data: newFormData,
        })
        .eq("id", form.id)
        .select()
        .single();
      if (error) throw error;
      toast.success("Visit form submitted successfully");
      onSubmitted(data as VisitForm);
    } catch (err: any) {
      toast.error(err.message || "Could not submit form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      {/* Back + title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-10 w-10 p-0 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-[#0A2E1F] shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {readOnly ? "Completed form" : "Complete your form"}
          </p>
          <h1 className="text-2xl font-black text-[#0A2E1F] tracking-tighter uppercase italic leading-none">
            {form.title}
          </h1>
          {form.visit_name && (
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
              {form.visit_name}
            </p>
          )}
        </div>
      </div>

      {/* Questions */}
      <Card className="border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
        <CardContent className="p-8 space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <label className="flex items-start gap-2 text-sm font-bold text-[#0A2E1F]">
                <span className="shrink-0 h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                {q.label}
                {q.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>

              {q.type === "textarea" && (
                <textarea
                  disabled={readOnly}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="Type your answer…"
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              )}

              {q.type === "text" && (
                <input
                  disabled={readOnly}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="Type your answer…"
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              )}

              {q.type === "select" && q.options && (
                <select
                  disabled={readOnly}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 appearance-none disabled:bg-slate-50 disabled:text-slate-500"
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                >
                  <option value="">Select an option…</option>
                  {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {q.type === "yesno" && (
                <div className="flex gap-3">
                  {["Yes", "No"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={readOnly}
                      onClick={() => !readOnly && setAnswer(q.id, opt)}
                      className={cn(
                        "flex-1 h-11 rounded-xl border text-sm font-bold transition-all",
                        answers[q.id] === opt
                          ? "bg-[#0A2E1F] text-white border-[#0A2E1F]"
                          : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300",
                        readOnly && "cursor-default",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "radio" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors",
                        answers[q.id] === opt
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200 hover:border-emerald-200",
                        readOnly && "cursor-default",
                      )}
                    >
                      <input
                        type="radio"
                        disabled={readOnly}
                        checked={answers[q.id] === opt}
                        onChange={() => !readOnly && setAnswer(q.id, opt)}
                        className="accent-emerald-600"
                      />
                      <span className="text-sm font-medium text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "checkbox" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const selected = (answers[q.id] || "").split(",").filter(Boolean);
                    const checked = selected.includes(opt);
                    return (
                      <label
                        key={opt}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors",
                          checked ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-emerald-200",
                          readOnly && "cursor-default",
                        )}
                      >
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={checked}
                          onChange={() => {
                            if (readOnly) return;
                            const next = checked
                              ? selected.filter((s) => s !== opt)
                              : [...selected, opt];
                            setAnswer(q.id, next.join(","));
                          }}
                          className="accent-emerald-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit / read-only footer */}
      {readOnly ? (
        <div className="flex items-center gap-3 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Form submitted</p>
            {form.form_data?.submitted_at && (
              <p className="text-xs text-emerald-700/70 mt-0.5">
                {new Date(form.form_data.submitted_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-emerald-900/10 gap-3 disabled:opacity-50"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
          ) : (
            <><Send className="h-4 w-4" /> Submit Form Securely</>
          )}
        </Button>
      )}
    </div>
  );
}

// ── Main VisitFormsPage ───────────────────────────────────────────────────────
export function VisitFormsPage() {
  const { user } = useAuthStore();
  const visitForms = usePatientStore((state) => state.visitForms) as VisitForm[];
  const visitFormsLoading = usePatientStore((state) => state.visitFormsLoading);
  const fetchVisitForms = usePatientStore((state) => state.fetchVisitForms);

  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  // Which form is open (id) and whether it's read-only
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [openReadOnly, setOpenReadOnly] = useState(false);

  // Local override so we can update status without waiting for a full refetch
  const [localForms, setLocalForms] = useState<VisitForm[]>([]);

  useEffect(() => {
    setLocalForms(visitForms as VisitForm[]);
  }, [visitForms]);

  const openForm = visitForms.find((f) => f.id === openFormId) as VisitForm | undefined;

  const filteredForms = localForms.filter((f) => {
    if (filter === "all") return true;
    return f.status === filter;
  });

  const pendingCount = localForms.filter((f) => f.status === "pending").length;

  const handleSubmitted = (updated: VisitForm) => {
    setLocalForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setOpenFormId(null);
    // Refresh store in background
    void fetchVisitForms();
  };

  // If a form is open, show the form viewer
  if (openFormId && openForm) {
    return (
      <FormViewer
        form={openForm}
        readOnly={openReadOnly}
        onBack={() => setOpenFormId(null)}
        onSubmitted={handleSubmitted}
      />
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-10 pb-32 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-emerald-100 bg-emerald-50 text-[#0A2E1F] px-3 py-1">
              Clinical Documentation
            </Badge>
            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-100 bg-slate-50 text-slate-400 px-3 py-1">
              Verified Profile
            </Badge>
          </div>
          <h1 className="text-3xl font-black text-[#0A2E1F] tracking-tighter uppercase italic">
            Visit <span className="text-emerald-600 font-serif italic font-normal">Questionnaires</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
            Manage assigned clinical consent and history forms
          </p>
        </div>

        <div
          className={cn(
            "flex bg-slate-50 p-1 rounded-2xl border border-slate-100 transition-opacity",
            visitFormsLoading && "pointer-events-none opacity-50",
          )}
          aria-busy={visitFormsLoading}
        >
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              disabled={visitFormsLoading}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                filter === f ? "bg-white text-[#0A2E1F] shadow-sm" : "text-slate-400 hover:text-slate-600",
              )}
            >
              {f} {f === "pending" && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Form list */}
      <div className="space-y-4">
        {visitFormsLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-widest">Loading visit forms…</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredForms.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-32 text-center"
              >
                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-6 w-6 text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No Documentation Required</p>
                <p className="text-xs text-slate-400 mt-2">Your clinical file is currently up to date.</p>
              </motion.div>
            ) : (
              <div className="grid gap-3">
                {filteredForms.map((form, idx) => {
                  const isPending = form.status === "pending" || form.status === "in-progress";
                  return (
                    <motion.div
                      key={form.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card
                        className={cn(
                          "group border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer",
                          form.urgent && isPending ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-slate-100",
                        )}
                        onClick={() => {
                          setOpenFormId(form.id);
                          setOpenReadOnly(!isPending);
                        }}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-center gap-6">
                            <div
                              className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                isPending ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600",
                              )}
                            >
                              {isPending ? <Clock className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-0.5">
                                <h3 className="font-bold text-sm text-[#0A2E1F] uppercase tracking-tight truncate">
                                  {form.title}
                                </h3>
                                {form.urgent && isPending && (
                                  <Badge className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase border-none px-2 h-4">
                                    Priority
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {form.visit_name && (
                                  <span className="flex items-center gap-1.5">
                                    <FileCheck size={12} className="text-emerald-500" /> {form.visit_name}
                                  </span>
                                )}
                                <span className="text-slate-200">|</span>
                                <span>Assigned {new Date(form.created_at).toLocaleDateString()}</span>
                                {!isPending && form.form_data?.submitted_at && (
                                  <>
                                    <span className="text-slate-200">|</span>
                                    <span className="text-emerald-500">
                                      Submitted {new Date(form.form_data.submitted_at).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isPending ? (
                                <Button
                                  size="sm"
                                  className="h-10 rounded-xl bg-[#0A2E1F] hover:bg-emerald-950 text-white font-black uppercase text-[9px] tracking-widest px-6 shadow-lg shadow-emerald-900/10 gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenFormId(form.id);
                                    setOpenReadOnly(false);
                                  }}
                                >
                                  Start <ArrowRight size={12} />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-10 rounded-xl text-slate-400 font-black uppercase text-[9px] tracking-widest px-4 gap-2 hover:bg-slate-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenFormId(form.id);
                                    setOpenReadOnly(true);
                                  }}
                                >
                                  Review <ChevronRight size={12} />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Security footer */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
            <ShieldCheck size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#0A2E1F] uppercase tracking-widest">Digital Sign-off Required</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Validated against your clinical record</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Security Protocol</p>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Active Encryption</p>
          </div>
          <Lock size={16} className="text-slate-200" />
        </div>
      </div>
    </div>
  );
}
