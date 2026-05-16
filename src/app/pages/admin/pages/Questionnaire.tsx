import { useState, useEffect } from "react";
import { Search, Plus, Filter, FileText, ArrowLeft, Smartphone, Trash2, GripVertical, Settings2, Loader2 } from "lucide-react";
import { Card, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { AdminDataTable, StatusText, ActionBadge } from "../../../components/ui/tables/AdminDataTable";
import { supabase } from "../../../../lib/supabaseClient";

type QuestionType = "text" | "choice" | "yes_no";

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: string[];
}

export function AdminQuestionnairePage() {
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [formName, setFormName] = useState("New Intake Form");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", type: "text", title: "What is your main health concern?", required: true },
    { id: "2", type: "yes_no", title: "Are you currently taking any prescription medications?", required: true }
  ]);

  useEffect(() => {
    async function fetchQuestionnaires() {
      try {
        const { data, error } = await supabase
          .from('admin_questionnaires')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setQuestionnaires(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestionnaires();
  }, []);

  const addQuestion = (type: QuestionType) => {
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(36).substr(2, 9),
        type,
        title: "New Question",
        required: false,
        options: type === "choice" ? ["Option 1", "Option 2"] : undefined,
      }
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  if (isBuilding) {
    return (
      <div className="flex h-[calc(100vh-100px)] flex-col font-sans text-slate-900 -m-6 bg-slate-100">
        {/* Builder Header — explicit light surface (readable even when app theme is dark) */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsBuilding(false)}
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
              <p className="mt-0.5 text-xs font-medium text-slate-500">Draft · Auto-saved just now</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-50">
              Preview
            </Button>
            <Button className="rounded-xl bg-[#0A2E1F] text-white hover:bg-[#051810]">Save & Publish</Button>
          </div>
        </div>

        {/* Split Screen Workspace */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* LEFT PANE: Editor */}
          <div className="w-1/2 space-y-6 overflow-y-auto border-r border-slate-200 bg-slate-50/90 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Form Builder</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addQuestion("text")} className="h-8 text-xs rounded-lg gap-1.5"><Plus className="h-3 w-3"/> Text</Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion("choice")} className="h-8 text-xs rounded-lg gap-1.5"><Plus className="h-3 w-3"/> Choice</Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion("yes_no")} className="h-8 text-xs rounded-lg gap-1.5"><Plus className="h-3 w-3"/> Yes/No</Button>
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

          {/* RIGHT PANE: Live Mobile Preview (always light phone chrome) */}
          <div className="flex w-1/2 items-center justify-center overflow-y-auto bg-slate-200/80 p-6">
            <div className="relative flex h-[680px] w-[340px] flex-col overflow-hidden rounded-[40px] border-[8px] border-slate-300 bg-white shadow-2xl">
              {/* Fake Mobile Header */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-[#0A2E1F] px-4 pb-4 pt-10 text-center text-white shadow-md">
                <img src="/PeakHealthLogo.png" alt="Logo" className="h-6 object-contain brightness-0 invert" />
                <h3 className="text-lg font-bold leading-tight text-white">{formName}</h3>
              </div>
              
              {/* Fake Mobile Body (Live Form) */}
              <div className="flex-1 space-y-6 overflow-y-auto bg-zinc-50 p-5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-1/4 rounded-full bg-[#0A2E1F]" />
                </div>
                
                {questions.map((q, i) => (
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
              
              {/* Fake Mobile Footer */}
              <div className="z-10 border-t border-slate-200 bg-white p-4">
                <Button className="h-12 w-full rounded-xl bg-[#0A2E1F] font-bold text-white hover:bg-[#051810]">
                  Next Step
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD LIST VIEW
  const columns = [
    { header: "Name", accessorKey: "name", cell: (item: any) => (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground mr-1">...</span>
        <a href="#" className="font-semibold underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors">{item.name}</a>
      </div>
    )},
    { header: "#ID", accessorKey: "id" },
    {
      header: "Created Date",
      accessorKey: "created_at",
      cell: (item: any) => (
        <span className="text-muted-foreground text-sm">
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
    { header: "Questions", accessorKey: "questions" },
    { header: "Products", accessorKey: "products" },
    { header: "Checkout Pages", accessorKey: "checkoutPages" },
    { header: "Domain", accessorKey: "domain" },
    { header: "Slug", accessorKey: "slug" },
    { header: "Review", accessorKey: "review", cell: (item: any) => (
      <ActionBadge label={item.review} variant={item.review === "Publish" ? "blue" : "red"} />
    )},
    { header: "Status", accessorKey: "status", cell: (item: any) => <StatusText status={item.status} /> },
    { header: "Mode", accessorKey: "mode", cell: (item: any) => <StatusText status={item.mode} /> },
    { header: "Intake Questionnaire", accessorKey: "intake" },
    { header: "last used date", accessorKey: "lastUsed" },
  ];

  return (
    <div className="max-w-[1500px] mx-auto font-sans space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Questionnaires</h1>
        <Button onClick={() => setIsBuilding(true)} className="bg-primary hover:bg-primary/90 text-white rounded-lg gap-2 text-[13px] h-9 px-4">
          Add new
        </Button>
      </div>

      <AdminDataTable 
        data={questionnaires} 
        columns={columns} 
        searchPlaceholder="Search by questionnaire name, slug, or ID"
        onRowClick={() => setIsBuilding(true)}
      />
    </div>
  );
}
