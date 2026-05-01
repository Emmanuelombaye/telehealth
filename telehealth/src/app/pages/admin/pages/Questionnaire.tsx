import { useState } from "react";
import { Plus, GripVertical, Trash2, Type, List, ToggleLeft, Hash, ChevronDown } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";

const questionTypes = [
  { type: "text", label: "Short Text", icon: Type },
  { type: "textarea", label: "Long Text", icon: Type },
  { type: "select", label: "Dropdown", icon: List },
  { type: "radio", label: "Single Choice", icon: ToggleLeft },
  { type: "number", label: "Number", icon: Hash },
];

const existingForms = [
  { id: 1, name: "General Health Intake", questions: 12, responses: 1240, status: "active" },
  { id: 2, name: "Mental Health Screening (PHQ-9)", questions: 9, responses: 890, status: "active" },
  { id: 3, name: "Post-Visit Satisfaction", questions: 6, responses: 2100, status: "active" },
  { id: 4, name: "COVID-19 Screening", questions: 8, responses: 340, status: "inactive" },
];

export function AdminQuestionnairePage() {
  const [building, setBuilding] = useState(false);
  const [questions, setQuestions] = useState([{ id: 1, type: "text", label: "What is your chief complaint?" }]);

  const addQuestion = (type: string) => setQuestions(q => [...q, { id: Date.now(), type, label: "New question" }]);
  const removeQuestion = (id: number) => setQuestions(q => q.filter(x => x.id !== id));

  if (building) return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Build Questionnaire</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setBuilding(false)}>Cancel</Button>
          <Button size="sm" className="rounded-xl text-xs">Publish</Button>
        </div>
      </div>
      <Card><CardContent className="p-4">
        <input className="w-full text-lg font-bold bg-transparent border-b border-border pb-2 focus:outline-none focus:border-primary" placeholder="Form Title..." />
        <input className="w-full text-sm text-muted-foreground bg-transparent mt-2 focus:outline-none" placeholder="Description (optional)..." />
      </CardContent></Card>
      <div className="space-y-2">
        {questions.map((q, i) => (
          <Card key={q.id} className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 shrink-0 cursor-grab" />
                <div className="flex-1 space-y-2">
                  <input defaultValue={q.label} className="w-full font-semibold text-sm bg-transparent border-b border-border pb-1 focus:outline-none focus:border-primary" />
                  <select className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none">
                    {questionTypes.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" className="accent-primary" /> Required
                  </label>
                </div>
                <button onClick={() => removeQuestion(q.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {questionTypes.map(t => (
          <Button key={t.type} size="sm" variant="outline" className="rounded-xl text-xs gap-1.5" onClick={() => addQuestion(t.type)}>
            <Plus className="h-3.5 w-3.5" /> {t.label}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Questionnaires</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs" onClick={() => setBuilding(true)}><Plus className="h-3.5 w-3.5" /> New Form</Button>
      </div>
      <div className="space-y-3">
        {existingForms.map(form => (
          <Card key={form.id} className="hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><List className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{form.name}</p>
                    <Badge variant={form.status === "active" ? "success" : "outline"} className="text-[10px]">{form.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{form.questions} questions · {form.responses.toLocaleString()} responses</p>
                </div>
                <Button size="sm" variant="outline" className="rounded-xl text-xs shrink-0">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
