import { useState } from "react";
import { Search, Plus, Filter, FileText, ArrowLeft, Smartphone, Trash2, GripVertical, Settings2 } from "lucide-react";
import { Card, Button, Badge, cn } from "../../../components/ui/shared";

const mockQuestionnaires = [
  { id: "6839", name: "Methylene Blue", date: "12/05/2025", questions: "61", products: "1" },
  { id: "6601", name: "ED Intake", date: "11/20/2025", questions: "64", products: "1" },
  { id: "6600", name: "Sermorelin Intake", date: "11/20/2025", questions: "64", products: "2" },
  { id: "6586", name: "Hair Loss Intake", date: "11/19/2025", questions: "98", products: "3" },
  { id: "6584", name: "Anti Aging Intake", date: "11/19/2025", questions: "42", products: "5" },
];

const tabs = ["All", "Active", "Inactive"];

type QuestionType = "text" | "choice" | "yes_no";

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: string[];
}

export function AdminQuestionnairePage() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [formName, setFormName] = useState("New Intake Form");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", type: "text", title: "What is your main health concern?", required: true },
    { id: "2", type: "yes_no", title: "Are you currently taking any prescription medications?", required: true }
  ]);

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
  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Questionnaires</h1>
        <Button onClick={() => setIsBuilding(true)} className="bg-primary hover:bg-primary/90 text-white rounded-lg gap-2">
          <Plus className="h-4 w-4" /> Add new
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border/60 pb-[1px]">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              tab === "All"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden bg-background">
        <div className="p-4 border-b border-border/60 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xl flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by questionnaire name, slug, or ID"
                className="w-full pl-9 pr-4 py-2 bg-transparent border-none text-[14px] outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 border border-border/80 rounded-full text-[13px] font-medium hover:bg-muted/50 transition-colors">
                Extra Filters <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              </button>
              <button className="text-[13px] font-medium border border-border/80 bg-muted/20 px-4 py-1.5 rounded-full hover:bg-muted/50 transition-colors">
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/20 border-b border-border/60 text-muted-foreground text-[13px]">
              <tr>
                <th className="font-medium py-3.5 px-6">Name</th>
                <th className="font-medium py-3.5 px-4">#ID</th>
                <th className="font-medium py-3.5 px-4">Created Date</th>
                <th className="font-medium py-3.5 px-4">Questions</th>
                <th className="font-medium py-3.5 px-4">Products</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {mockQuestionnaires.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => setIsBuilding(true)}>
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </td>
                  <td className="py-4 px-4 text-foreground/80">{item.id}</td>
                  <td className="py-4 px-4 text-foreground/80">{item.date}</td>
                  <td className="py-4 px-4 text-foreground/80">{item.questions}</td>
                  <td className="py-4 px-4 text-foreground/80">
                    <span className="bg-muted px-2.5 py-1 rounded-full text-xs font-medium">{item.products}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
