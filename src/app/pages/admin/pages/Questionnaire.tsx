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
      <div className="h-[calc(100vh-100px)] flex flex-col font-sans -m-6">
        {/* Builder Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-background">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsBuilding(false)} className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <input 
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 m-0"
              />
              <p className="text-xs text-muted-foreground mt-0.5">Draft · Auto-saved just now</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl">Preview</Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white">Save & Publish</Button>
          </div>
        </div>

        {/* Split Screen Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANE: Editor */}
          <div className="w-1/2 overflow-y-auto border-r border-border/60 bg-muted/10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Form Builder</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addQuestion("text")} className="h-8 text-xs rounded-lg gap-1.5"><Plus className="h-3 w-3"/> Text</Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion("choice")} className="h-8 text-xs rounded-lg gap-1.5"><Plus className="h-3 w-3"/> Choice</Button>
                <Button variant="outline" size="sm" onClick={() => addQuestion("yes_no")} className="h-8 text-xs rounded-lg gap-1.5"><Plus className="h-3 w-3"/> Yes/No</Button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, index) => (
                <Card key={q.id} className="border-border shadow-sm group">
                  <div className="p-4 flex gap-4">
                    <div className="mt-1 cursor-grab opacity-40 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wide text-primary">Question {index + 1} ({q.type})</label>
                          <input 
                            value={q.title}
                            onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-6">
                          <button onClick={() => updateQuestion(q.id, { required: !q.required })}
                            className={cn("text-xs font-semibold px-2 py-1 rounded-md transition-colors", q.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                            {q.required ? "Required" : "Optional"}
                          </button>
                          <button onClick={() => removeQuestion(q.id)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {q.type === "choice" && (
                        <div className="pl-4 border-l-2 border-border/50 space-y-2">
                          {q.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full border border-muted-foreground/40" />
                              <input 
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...(q.options || [])];
                                  newOpts[i] = e.target.value;
                                  updateQuestion(q.id, { options: newOpts });
                                }}
                                className="flex-1 bg-transparent border-b border-border/50 px-1 py-0.5 text-sm focus:outline-none focus:border-primary"
                              />
                            </div>
                          ))}
                          <button 
                            onClick={() => updateQuestion(q.id, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}
                            className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-2">
                            <Plus className="h-3 w-3" /> Add Option
                          </button>
                        </div>
                      )}
                      
                      {q.type === "yes_no" && (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="px-4 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200">Yes</Badge>
                          <Badge variant="outline" className="px-4 py-1.5 text-xs bg-red-50 dark:bg-red-950/20 text-red-600 border-red-200">No</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">Add your first question to begin building</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Live Mobile Preview */}
          <div className="w-1/2 bg-muted/30 flex items-center justify-center p-6 overflow-y-auto">
            <div className="relative w-[340px] h-[680px] bg-white dark:bg-black rounded-[40px] shadow-2xl border-[8px] border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
              {/* Fake Mobile Header */}
              <div className="bg-primary px-4 pt-10 pb-4 text-white text-center shadow-md z-10 relative flex flex-col items-center gap-2">
                <img src="/PeakHealthLogo.png" alt="Logo" className="h-6 object-contain brightness-0 invert" />
                <h3 className="font-bold text-lg leading-tight">{formName}</h3>
              </div>
              
              {/* Fake Mobile Body (Live Form) */}
              <div className="flex-1 overflow-y-auto p-5 bg-zinc-50 dark:bg-zinc-900/50 space-y-6">
                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary w-1/4 h-full rounded-full" />
                </div>
                
                {questions.map((q, i) => (
                  <div key={q.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-[15px] font-semibold leading-snug">
                      {q.title} {q.required && <span className="text-red-500">*</span>}
                    </p>
                    
                    {q.type === "text" && (
                      <textarea 
                        disabled
                        className="w-full border border-border/80 rounded-xl p-3 text-sm bg-white dark:bg-zinc-950 resize-none placeholder:text-muted-foreground/40"
                        rows={3}
                        placeholder="Type your answer here..."
                      />
                    )}
                    
                    {q.type === "choice" && (
                      <div className="space-y-2">
                        {q.options?.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 border border-border/80 rounded-xl bg-white dark:bg-zinc-950">
                            <div className="h-4 w-4 rounded-full border border-muted-foreground/40" />
                            <span className="text-sm">{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {q.type === "yes_no" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border border-border/80 rounded-xl bg-white dark:bg-zinc-950 text-center font-medium text-sm">Yes</div>
                        <div className="p-3 border border-border/80 rounded-xl bg-white dark:bg-zinc-950 text-center font-medium text-sm">No</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Fake Mobile Footer */}
              <div className="p-4 bg-white dark:bg-black border-t border-border z-10">
                <Button className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-white font-bold">
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
    { header: "Created Date", accessorKey: "date" },
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
        <h1 className="text-2xl font-semibold">Questionnaires</h1>
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
