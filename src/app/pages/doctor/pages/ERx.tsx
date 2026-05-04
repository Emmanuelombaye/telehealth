import { useState } from "react";
import { Pill, AlertTriangle, ShieldCheck, Search, Send, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared";

export function DoctorERxPage() {
  const [search, setSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState<string | null>(null);

  const interactions = selectedMed === "Lisinopril 10mg" ? [
    { type: "warning", message: "Moderate interaction with current med: NSAID (Ibuprofen). May decrease antihypertensive effect." }
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" /> Advanced E-Prescribing (eRx)
          </h1>
          <p className="text-sm text-muted-foreground">Secure prescription routing with real-time safety checks.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Medication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search database (e.g., Lisinopril)..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {["Lisinopril 10mg", "Amoxicillin 500mg", "Metformin 500mg", "Sertraline 50mg"].map(med => (
                <div 
                  key={med}
                  onClick={() => setSelectedMed(med)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedMed === med ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <p className="font-bold text-sm">{med}</p>
                  <p className="text-xs text-muted-foreground mt-1">Commonly prescribed for Hypertension</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" /> Safety Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedMed ? (
                <p className="text-sm text-muted-foreground text-center py-4">Select a medication to run safety checks.</p>
              ) : interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map((int, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex gap-3 items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-amber-900 dark:text-amber-200">Interaction Detected</p>
                        <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">{int.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Safe to Prescribe</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">No known allergies or interactions found.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={!selectedMed ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Prescription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Quantity</label>
                  <input type="number" defaultValue="30" className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Refills</label>
                  <input type="number" defaultValue="2" className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Patient Pharmacy</label>
                <div className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-muted text-muted-foreground">
                  CVS Pharmacy #1042 (Preferred)
                </div>
              </div>
              <Button className="w-full rounded-xl mt-4 bg-primary hover:bg-primary/90">
                <Send className="h-4 w-4 mr-2" /> Send via SureScripts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
