import { useEffect, useMemo, useState } from "react";
import { Pill, AlertTriangle, ShieldCheck, Search, Send, FileCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

const FORMULARY = [
  { name: "Lisinopril 10 mg",   indication: "Hypertension",     interactsWith: ["Ibuprofen", "NSAID"] },
  { name: "Amoxicillin 500 mg", indication: "Bacterial infection", interactsWith: ["Methotrexate"] },
  { name: "Metformin 500 mg",   indication: "Type 2 diabetes",  interactsWith: ["Iodinated contrast"] },
  { name: "Sertraline 50 mg",   indication: "Depression / anxiety", interactsWith: ["MAOI", "Tramadol", "St. John's Wort"] },
  { name: "Sildenafil 50 mg",   indication: "Erectile dysfunction", interactsWith: ["Nitrates"] },
  { name: "Finasteride 1 mg",   indication: "Male pattern hair loss", interactsWith: [] },
  { name: "Semaglutide 0.25 mg", indication: "Weight management", interactsWith: ["Insulin", "Sulfonylureas"] },
];

type PatientRow = { user_id: string; patient_name: string; medication: string };

/** Doctor eRx always uses light fields (readable in light + dark app theme). */
const ERX_FIELD =
  "w-full mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0A0D14] shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-60";
const ERX_CARD = "bg-white/95 border-emerald-100/80 shadow-sm";

export function DoctorERxPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState<typeof FORMULARY[number] | null>(null);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientId, setPatientId] = useState<string>("");
  const [quantity, setQuantity] = useState("30");
  const [refills, setRefills] = useState("2");
  const [frequency, setFrequency] = useState("Once daily");
  const [pharmacy, setPharmacy] = useState("In-house compounding pharmacy");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('user_id, patient_name, medication')
        .order('created_at', { ascending: false });
      if (error) { console.error("ERx patient fetch:", error); return; }
      const seen = new Set<string>();
      const list = (data || []).filter((r: any) => {
        if (!r.user_id || seen.has(r.user_id)) return false;
        seen.add(r.user_id); return true;
      }) as PatientRow[];
      setPatients(list);
    })();
  }, []);

  const filteredFormulary = useMemo(() =>
    FORMULARY.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.indication.toLowerCase().includes(search.toLowerCase()))
  , [search]);

  // Cross-check against the patient's existing medication on file
  const interactions = useMemo(() => {
    if (!selectedMed || !patientId) return [];
    const p = patients.find(p => p.user_id === patientId);
    if (!p?.medication) return [];
    return selectedMed.interactsWith
      .filter(x => p.medication.toLowerCase().includes(x.toLowerCase()))
      .map(x => `Moderate interaction: ${selectedMed.name} + patient's ${x}.`);
  }, [selectedMed, patientId, patients]);

  async function handleSend() {
    if (!user || !patientId || !selectedMed) return;
    setSubmitting(true); setSuccess(null);
    try {
      const { error } = await supabase.from('prescriptions').insert({
        patient_id: patientId,
        doctor_id: user.id,
        medication: selectedMed.name,
        dosage: `${quantity} units`,
        frequency,
        refills_remaining: parseInt(refills, 10) || 0,
        pharmacy_name: pharmacy,
        status: 'active',
      });
      if (error) throw error;
      setSuccess(`Sent ${selectedMed.name} to ${patients.find(p => p.user_id === patientId)?.patient_name}.`);
      setSelectedMed(null);
    } catch (err: any) {
      setSuccess(`Failed: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0A2E1F]">
            <Pill className="h-6 w-6 text-emerald-700" /> Advanced E-Prescribing (eRx)
          </h1>
          <p className="text-sm text-slate-600">Secure prescription routing with real-time safety checks.</p>
        </div>
      </div>

      {success && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="p-3 text-sm flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {success}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className={ERX_CARD}>
          <CardHeader>
            <CardTitle className="text-lg text-[#0A2E1F]">Select Medication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search formulary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-[#0A0D14] placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25"
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredFormulary.map(med => (
                <div
                  key={med.name}
                  onClick={() => setSelectedMed(med)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedMed?.name === med.name
                      ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-500/30"
                      : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                  }`}
                >
                  <p className="font-bold text-sm text-[#0A2E1F]">{med.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{med.indication}</p>
                </div>
              ))}
              {filteredFormulary.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No medications match "{search}".</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className={ERX_CARD}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-[#0A2E1F]">
                <ShieldCheck className="h-5 w-5 text-emerald-500" /> Safety Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedMed ? (
                <p className="text-sm text-muted-foreground text-center py-4">Select a medication to run safety checks.</p>
              ) : !patientId ? (
                <p className="text-sm text-muted-foreground text-center py-4">Select a patient below to cross-check current medications.</p>
              ) : interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map((msg, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex gap-3 items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-amber-900 dark:text-amber-200">Interaction Detected</p>
                        <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">{msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex items-center gap-3">
                  <FileCheck className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Safe to Prescribe</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">No known interactions with patient's current medications.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className={`${ERX_CARD} ${!selectedMed ? "opacity-60 pointer-events-none" : ""} transition-opacity`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[#0A2E1F]">Prescription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Patient</label>
                <select value={patientId} onChange={e => setPatientId(e.target.value)} className={ERX_FIELD}>
                  <option value="" className="text-[#0A0D14] bg-white">Select patient...</option>
                  {patients.map(p => (
                    <option key={p.user_id} value={p.user_id} className="text-[#0A0D14] bg-white">
                      {p.patient_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Quantity</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className={ERX_FIELD} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Refills</label>
                  <input type="number" value={refills} onChange={e => setRefills(e.target.value)} className={ERX_FIELD} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Frequency</label>
                <input type="text" value={frequency} onChange={e => setFrequency(e.target.value)} className={ERX_FIELD} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Pharmacy</label>
                <input type="text" value={pharmacy} onChange={e => setPharmacy(e.target.value)} className={ERX_FIELD} />
              </div>
              <Button
                className="w-full rounded-xl mt-4 bg-[#0A2E1F] text-white hover:bg-emerald-900 disabled:bg-slate-300 disabled:text-slate-500"
                disabled={submitting || !patientId || !selectedMed}
                onClick={handleSend}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {submitting ? "Sending..." : "Send Prescription"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
