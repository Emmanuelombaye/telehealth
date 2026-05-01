import { useState } from "react";
import { CheckCircle2, Circle, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared";

const forms = [
  { id: 1, title: "General Health Intake", status: "completed", required: true, completedDate: "May 10, 2026" },
  { id: 2, title: "Cardiovascular Risk Assessment", status: "pending", required: true, completedDate: null },
  { id: 3, title: "Mental Health Screening (PHQ-9)", status: "pending", required: false, completedDate: null },
  { id: 4, title: "Medication History", status: "completed", required: true, completedDate: "May 10, 2026" },
  { id: 5, title: "Allergy & Adverse Reactions", status: "in-progress", required: true, completedDate: null },
];

const steps = ["Personal Info", "Medical History", "Symptoms", "Medications", "Review"];

export function IntakeFormsPage() {
  const [activeForm, setActiveForm] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (activeForm !== null) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold">{forms.find(f => f.id === activeForm)?.title}</h1>
            <span className="text-xs text-muted-foreground">{step + 1} / {steps.length}</span>
          </div>
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {steps.map((s, i) => (
              <span key={i} className={cn("text-[10px] font-medium", i === step ? "text-primary" : "text-muted-foreground")}>{s}</span>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            {step === 0 && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-semibold">Full Legal Name</label>
                  <input className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary" placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">Date of Birth</label>
                    <input type="date" className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">Biological Sex</label>
                    <select className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold">Country of Residence</label>
                  <select className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary">
                    <option>United States</option><option>United Kingdom</option><option>Saudi Arabia</option>
                    <option>Spain</option><option>France</option><option>Brazil</option><option>China</option>
                  </select>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <p className="text-sm font-semibold">Do you have any of the following conditions?</p>
                {["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Cancer (any)", "Thyroid Disorder"].map(c => (
                  <label key={c} className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-accent">
                    <input type="checkbox" className="h-4 w-4 accent-primary" />
                    <span className="text-sm">{c}</span>
                  </label>
                ))}
              </>
            )}
            {step === 2 && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-semibold">Describe your current symptoms</label>
                  <textarea rows={4} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary resize-none" placeholder="Describe what you're experiencing..." />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold">Pain level (0–10)</label>
                  <input type="range" min={0} max={10} className="w-full accent-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold">Duration of symptoms</label>
                  <select className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary">
                    <option>Less than 24 hours</option><option>1–3 days</option><option>1 week</option><option>More than 1 week</option>
                  </select>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <p className="text-sm font-semibold">Current Medications</p>
                <div className="space-y-2">
                  {["Medication name", "Dosage", "Frequency"].map(f => (
                    <input key={f} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary" placeholder={f} />
                  ))}
                </div>
                <Button variant="outline" size="sm" className="rounded-xl text-xs">+ Add Another Medication</Button>
              </>
            )}
            {step === 4 && (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-lg">Ready to Submit</h3>
                <p className="text-sm text-muted-foreground">Your intake form is complete. This information is encrypted and HIPAA-compliant.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {step > 0 && <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(s => s - 1)}>Back</Button>}
          {step < steps.length - 1
            ? <Button className="flex-1 rounded-xl" onClick={() => setStep(s => s + 1)}>Continue</Button>
            : <Button className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600" onClick={() => setActiveForm(null)}>Submit Securely</Button>
          }
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold">Intake Forms</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Complete required forms before your consultation</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">2 forms required before your next appointment</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Please complete by May 19, 2026</p>
        </div>
      </div>

      <div className="space-y-3">
        {forms.map(form => (
          <Card key={form.id} className={cn("cursor-pointer hover:border-primary/40 transition-colors", form.status === "in-progress" && "border-primary/40")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  form.status === "completed" ? "bg-emerald-100 dark:bg-emerald-950" : form.status === "in-progress" ? "bg-primary/10" : "bg-muted")}>
                  {form.status === "completed"
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    : <Circle className={cn("h-5 w-5", form.status === "in-progress" ? "text-primary" : "text-muted-foreground")} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{form.title}</p>
                    {form.required && <Badge variant="outline" className="text-[9px] shrink-0">Required</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {form.status === "completed" ? `Completed ${form.completedDate}` : form.status === "in-progress" ? "In progress — resume" : "Not started"}
                  </p>
                </div>
                {form.status !== "completed" && (
                  <Button size="sm" variant={form.status === "in-progress" ? "primary" : "outline"} className="rounded-xl text-xs shrink-0"
                    onClick={() => setActiveForm(form.id)}>
                    {form.status === "in-progress" ? "Resume" : "Start"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
