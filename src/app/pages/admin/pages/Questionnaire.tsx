import { useState, useEffect, useCallback } from "react";
import { Plus, ArrowLeft, GripVertical, Trash2, Loader2 } from "lucide-react";
import { Card, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { AdminDataTable, StatusText } from "../../../components/ui/tables/AdminDataTable";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib/auth-store";
import { toast } from "sonner";
import { SuperAdminShell } from "../../../components/superadmin/SuperAdminShell";
import { AdminScopeNotice } from "../../../components/admin/AdminScopeNotice";

type QuestionType = "text" | "choice" | "yes_no";

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: string[];
}

interface QuestionnaireRow {
  id: string;
  created_at: string;
  updated_at?: string;
  name: string;
  slug: string | null;
  status: string;
  questions: unknown;
  brand_id: string | null;
}

const DEFAULT_QUESTIONS: Question[] = [
  { id: "1", type: "text", title: "What is your main health concern?", required: true },
  {
    id: "2",
    type: "yes_no",
    title: "Are you currently taking any prescription medications?",
    required: true,
  },
];

function slugify(name: string): string | null {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return s.length ? s : null;
}

function normalizeQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return [...DEFAULT_QUESTIONS];
  return raw.map((q: Record<string, unknown>, i: number) => {
    const t = q.type;
    const type: QuestionType =
      t === "choice" || t === "yes_no" || t === "text" ? t : "text";
    const opts = q.options;
    return {
      id: String(q.id ?? `q-${i}`),
      type,
      title: String(q.title ?? "Question"),
      required: Boolean(q.required),
      options:
        type === "choice" && Array.isArray(opts)
          ? opts.map((o) => String(o))
          : undefined,
    };
  });
}

function questionCount(row: QuestionnaireRow): number {
  const q = row.questions;
  return Array.isArray(q) ? q.length : 0;
}

function statusLabel(status: string): string {
  if (status === "live") return "Live";
  if (status === "draft") return "Draft";
  return status;
}

export function AdminQuestionnairePage() {
  const { user, role, brandId } = useAuthStore();
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("New Intake Form");
  const [builderStatus, setBuilderStatus] = useState<"draft" | "live">("draft");
  const [questions, setQuestions] = useState<Question[]>([...DEFAULT_QUESTIONS]);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const fetchQuestionnaires = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("admin_questionnaires")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestionnaires((data as QuestionnaireRow[]) || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load questionnaires", {
        description: err instanceof Error ? err.message : "Check Supabase RLS and migrations.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuestionnaires();
  }, [fetchQuestionnaires]);

  const addQuestion = (type: QuestionType) => {
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(36).slice(2, 11),
        type,
        title: "New Question",
        required: false,
        options: type === "choice" ? ["Option 1", "Option 2"] : undefined,
      },
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormName("New Intake Form");
    setQuestions([...DEFAULT_QUESTIONS]);
    setBuilderStatus("draft");
    setLastSavedAt(null);
    setIsBuilding(true);
  };

  const openEditForm = (row: QuestionnaireRow) => {
    setEditingId(row.id);
    setFormName(row.name || "Untitled");
    setQuestions(normalizeQuestions(row.questions));
    setBuilderStatus(row.status === "live" ? "live" : "draft");
    setLastSavedAt(row.updated_at || row.created_at);
    setIsBuilding(true);
  };

  const persistQuestionnaire = async (nextStatus: "draft" | "live") => {
    if (role === "brand_admin" && !brandId) {
      toast.error("Missing brand on your account", {
        description: "Set brand_id in JWT or profile before saving questionnaires.",
      });
      return;
    }

    setSaving(true);
    try {
      const slug = slugify(formName);
      const payload = {
        name: formName.trim() || "Untitled questionnaire",
        slug,
        status: nextStatus,
        questions: questions as unknown as Record<string, unknown>[],
        brand_id: role === "brand_admin" ? brandId : null,
        created_by: user?.id ?? null,
      };

      if (editingId) {
        const { data, error } = await supabase
          .from("admin_questionnaires")
          .update({
            name: payload.name,
            slug: payload.slug,
            status: payload.status,
            questions: payload.questions,
          })
          .eq("id", editingId)
          .select("id, updated_at, status")
          .single();

        if (error) throw error;
        setBuilderStatus(data.status === "live" ? "live" : "draft");
        setLastSavedAt(data.updated_at || new Date().toISOString());
        toast.success(nextStatus === "live" ? "Published" : "Draft saved");
      } else {
        const { data, error } = await supabase
          .from("admin_questionnaires")
          .insert([payload])
          .select("id, updated_at, status")
          .single();

        if (error) throw error;
        setEditingId(data.id);
        setBuilderStatus(data.status === "live" ? "live" : "draft");
        setLastSavedAt(data.updated_at || new Date().toISOString());
        toast.success(nextStatus === "live" ? "Created and published" : "Draft created");
      }

      await fetchQuestionnaires();
    } catch (err) {
      console.error(err);
      toast.error("Save failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackFromBuilder = () => {
    setIsBuilding(false);
    void fetchQuestionnaires();
  };

  if (isBuilding) {
    const statusLine =
      builderStatus === "live" ? "Live" : "Draft";
    const savedLine = lastSavedAt
      ? `Last saved ${new Date(lastSavedAt).toLocaleString()}`
      : "Not saved to database yet";

    return (
      <div className="flex h-[calc(100vh-100px)] flex-col font-sans text-slate-900 bg-slate-100 -m-6 md:-m-10">

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBackFromBuilder}
              className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Back to questionnaires"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="m-0 border-none bg-transparent p-0 text-xl font-bold text-slate-900 outline-none focus:ring-0"
              />
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {statusLine} · {savedLine}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              onClick={() => void persistQuestionnaire("draft")}
            >
              {saving ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
              Save draft
            </Button>
            <Button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A2E1F] text-white hover:bg-[#051810]"
              disabled={saving}
              onClick={() => void persistQuestionnaire("live")}
            >
              {saving ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
              Save &amp; Publish
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="w-1/2 space-y-6 overflow-y-auto border-r border-slate-200 bg-slate-50/90 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Form Builder</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addQuestion("text")} className="h-8 text-xs rounded-lg gap-1.5">
                  <Plus className="h-3 w-3" /> Text
                </Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion("choice")} className="h-8 text-xs rounded-lg gap-1.5">
                  <Plus className="h-3 w-3" /> Choice
                </Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion("yes_no")} className="h-8 text-xs rounded-lg gap-1.5">
                  <Plus className="h-3 w-3" /> Yes/No
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, index) => (
                <Card key={q.id} className="group border-slate-200 bg-white shadow-sm">
                  <div className="flex gap-4 p-4">
                    <div className="mt-1 cursor-grab opacity-40 transition-opacity group-hover:opacity-100">
                      <GripVertical className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wide text-[#0A2E1F]">
                            Question {index + 1} ({q.type})
                          </label>
                          <input
                            value={q.title}
                            onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0A2E1F] focus:outline-none focus:ring-1 focus:ring-[#0A2E1F]/20"
                          />
                        </div>
                        <div className="mt-6 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuestion(q.id, { required: !q.required })}
                            className={cn(
                              "rounded-md px-2 py-1 text-xs font-semibold transition-colors",
                              q.required
                                ? "bg-emerald-50 text-[#0A2E1F]"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                            )}
                          >
                            {q.required ? "Required" : "Optional"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestion(q.id)}
                            className="p-1.5 text-slate-400 transition-colors hover:text-red-600"
                            aria-label="Remove question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {q.type === "choice" && (
                        <div className="space-y-2 border-l-2 border-slate-200 pl-4">
                          {q.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full border border-slate-300" />
                              <input
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...(q.options || [])];
                                  newOpts[i] = e.target.value;
                                  updateQuestion(q.id, { options: newOpts });
                                }}
                                className="flex-1 border-b border-slate-200 bg-transparent px-1 py-0.5 text-sm text-slate-900 focus:border-[#0A2E1F] focus:outline-none"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestion(q.id, {
                                options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`],
                              })
                            }
                            className="mt-2 flex items-center gap-1 text-xs font-medium text-[#0A2E1F] hover:underline"
                          >
                            <Plus className="h-3 w-3" /> Add Option
                          </button>
                        </div>
                      )}

                      {q.type === "yes_no" && (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs text-emerald-800">
                            Yes
                          </Badge>
                          <Badge variant="outline" className="border-red-200 bg-red-50 px-4 py-1.5 text-xs text-red-800">
                            No
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {questions.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-slate-300 py-12 text-center">
                  <p className="text-sm text-slate-600">Add your first question to begin building</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex w-1/2 items-center justify-center overflow-y-auto bg-slate-200/80 p-6">
            <div className="relative flex h-[680px] w-[340px] flex-col overflow-hidden rounded-[40px] border-[8px] border-slate-300 bg-white shadow-2xl">
              <div className="relative z-10 flex flex-col items-center gap-2 bg-[#0A2E1F] px-4 pb-4 pt-10 text-center text-white shadow-md">
                <img src="/PeakHealthLogo.png" alt="Logo" className="h-6 object-contain brightness-0 invert" />
                <h3 className="text-lg font-bold leading-tight text-white">{formName}</h3>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto bg-zinc-50 p-5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-1/4 rounded-full bg-[#0A2E1F]" />
                </div>

                {questions.map((q) => (
                  <div key={q.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-[15px] font-semibold leading-snug text-slate-900">
                      {q.title} {q.required && <span className="text-red-600">*</span>}
                    </p>

                    {q.type === "text" && (
                      <textarea
                        disabled
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400"
                        rows={3}
                        placeholder="Type your answer here..."
                      />
                    )}

                    {q.type === "choice" && (
                      <div className="space-y-2">
                        {q.options?.map((opt, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div className="h-4 w-4 rounded-full border border-slate-300" />
                            <span className="text-sm text-slate-800">{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === "yes_no" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center text-sm font-medium text-slate-800">
                          Yes
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center text-sm font-medium text-slate-800">
                          No
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="z-10 border-t border-slate-200 bg-white p-4">
                <Button 
                  className="h-12 w-full rounded-xl bg-[#0A2E1F] font-bold text-white hover:bg-[#051810]"
                  onClick={() => toast.info("Preview mode: this button is non-functional.")}
                >
                  Next Step
                </Button>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (item: QuestionnaireRow) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-left font-semibold underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              openEditForm(item);
            }}
          >
            {item.name}
          </button>
        </div>
      ),
    },
    { header: "ID", accessorKey: "id", cell: (item: QuestionnaireRow) => <span className="font-mono text-[11px] text-muted-foreground">{item.id.slice(0, 8)}…</span> },
    {
      header: "Created",
      accessorKey: "created_at",
      cell: (item: QuestionnaireRow) => (
        <span className="text-muted-foreground text-sm">
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      header: "Questions",
      accessorKey: "questions",
      cell: (item: QuestionnaireRow) => <span className="tabular-nums">{questionCount(item)}</span>,
    },
    {
      header: "Slug",
      accessorKey: "slug",
      cell: (item: QuestionnaireRow) => (
        <span className="text-muted-foreground text-sm">{item.slug || "—"}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item: QuestionnaireRow) => <StatusText status={statusLabel(item.status)} />,
    },
  ];

  const isSuper = role === "super_admin";

  const listContent = (
    <div className={cn("max-w-[1500px] mx-auto font-sans space-y-6", isSuper && "max-w-none")}>
      {!isBuilding && <AdminScopeNotice variant={isSuper ? "platform" : "brand"} />}
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          {!isSuper && "Questionnaires"}
        </h1>
        <Button
          onClick={openNewForm}
          className="bg-primary hover:bg-primary/90 text-white rounded-lg gap-2 text-[13px] h-9 px-4"
        >
          Add new
        </Button>
      </div>

      {loading && questionnaires.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <AdminDataTable<QuestionnaireRow>
          data={questionnaires}
          columns={columns}
          searchPlaceholder="Search by name, slug, or ID"
          onRowClick={openEditForm}
          getSearchText={(item) => `${item.name} ${item.slug ?? ""} ${item.id}`}
          getStatusCategory={(item) => (item.status === "live" ? "active" : "inactive")}
          onRefresh={() => void fetchQuestionnaires()}
          rowKey={(item) => item.id}
          getCopyTsvLine={(item) =>
            [item.name, item.id, item.created_at, String(questionCount(item)), item.slug ?? "", item.status].join("\t")
          }
        />
      )}
    </div>
  );

  if (isSuper) {
    return (
      <SuperAdminShell
        title="Intake Questionnaires"
        description="Configure dynamic medical intake forms and screening questions for patients across all platform brands."
      >
        {listContent}
      </SuperAdminShell>
    );
  }

  return listContent;
}

