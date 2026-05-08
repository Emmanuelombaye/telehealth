import { useState } from "react";
import { CheckCircle2, Circle, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { usePatientStore } from "../../../../lib/patient-store";

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
  const [viewMode, setViewMode] = useState(false);
  
  // Use centralized Zustand store instead of local state
  const intakeFormData = usePatientStore(state => state.intakeFormData);
  const setIntakeFormData = usePatientStore(state => state.setIntakeFormData);

  // Read-only view for completed forms
  if (activeForm !== null && viewMode) {
    const form = forms.find(f => f.id === activeForm);
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{form?.title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Submitted {form?.completedDate}</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => {
            setActiveForm(null);
            setViewMode(false);
          }}>
            Back to Forms
          </Button>
        </div>

        <Card>
          <CardContent className="p-5 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">Personal Information</h3>
              <div className="grid gap-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Full Legal Name</span>
                  <span className="text-sm font-medium">John Doe</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Date of Birth</span>
                  <span className="text-sm font-medium">06/15/1987</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Biological Sex</span>
                  <span className="text-sm font-medium">Male</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Country of Residence</span>
                  <span className="text-sm font-medium">United States</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">Medical History</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Reported Conditions:</p>
                <div className="flex flex-wrap gap-2">
                  {["Hypertension", "Asthma"].map(c => (
                    <Badge key={c} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">{c}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">Symptoms Reported</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">Occasional chest discomfort, shortness of breath with exertion, mild fatigue.</p>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Pain Level</span>
                  <span className="text-sm font-medium">4 / 10</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">1 week</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">Current Medications</h3>
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-xl">
                  <p className="font-medium text-sm">Lisinopril 10mg</p>
                  <p className="text-xs text-muted-foreground">Once daily</p>
                </div>
                <div className="p-3 bg-muted rounded-xl">
                  <p className="font-medium text-sm">Albuterol Inhaler</p>
                  <p className="text-xs text-muted-foreground">As needed</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Form submitted successfully</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">This record is encrypted and stored securely</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                {form.status === "completed" ? (
                  <Button size="sm" variant="ghost" className="rounded-xl text-xs shrink-0"
                    onClick={() => {
                      setActiveForm(form.id);
                      setViewMode(true);
                    }}>
                    View Answers
                  </Button>
                ) : (
                  <Button size="sm" variant={form.status === "in-progress" ? "primary" : "outline"} className="rounded-xl text-xs shrink-0"
                    onClick={() => {
                      setActiveForm(form.id);
                      setViewMode(false);
                    }}>
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
