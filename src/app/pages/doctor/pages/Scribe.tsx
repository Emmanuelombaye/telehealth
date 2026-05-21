import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Mic,
  MicOff,
  RefreshCw,
  FileText,
  Bot,
  Sparkles,
  Loader2,
  Search,
  Copy,
  Stethoscope,
  User,
  ClipboardList,
  BookOpen,
  Save,
  Trash2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { doctorPageContainer, doctorSurfaceCard } from "../../../../lib/doctorPortalUi";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { isMissingTableError } from "../../../../lib/supabaseTableError";
import {
  buildIntakePrefill,
  emptySoapNote,
  formatFullSoapText,
  formatNoteDate,
  mapSavedNotes,
  NOTE_TEMPLATES,
  serializeSoapToDiagnosis,
  SOAP_SECTIONS,
  soapWordCount,
  type SavedClinicalNote,
  type SoapNote,
} from "../../../../lib/doctorClinicalNotes";
import { toast } from "sonner";

type SpeechRecInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: { length: number; [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type EncounterOption = {
  id: string;
  order_number: string;
  user_id: string | null;
  patient_name: string;
  category: string;
  medication: string;
  intake_notes?: string | null;
  patient_age?: number | null;
  patient_vitals?: unknown;
  intake_answers?: Record<string, unknown> | null;
};

type HubTab = "compose" | "library" | "templates";

export function DoctorScribePage() {
  const doctorBase = useDoctorPortalBase();
  const { user } = useAuthStore();
  const [hubTab, setHubTab] = useState<HubTab>("compose");
  const [encounters, setEncounters] = useState<EncounterOption[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>("");
  const [soapNote, setSoapNote] = useState<SoapNote>(emptySoapNote());
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedClinicalNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesMissing, setNotesMissing] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecInstance | null>(null);

  const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId) ?? null;

  const fetchEncounters = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, user_id, patient_name, category, medication, intake_notes, patient_age, patient_vitals, intake_answers")
      .order("created_at", { ascending: false })
      .limit(200);
    const list = (data || []) as EncounterOption[];
    setEncounters(list);
    setSelectedEncounterId((prev) => prev || list[0]?.id || "");
  }, []);

  const fetchSavedNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const { data, error } = await supabase
        .from("visit_summaries")
        .select("*")
        .order("date", { ascending: false })
        .limit(100);
      if (error) {
        if (isMissingTableError(error)) setNotesMissing(true);
        setSavedNotes([]);
        return;
      }
      setNotesMissing(false);
      const nameMap = new Map<string, string>();
      for (const e of encounters) {
        if (e.user_id) nameMap.set(e.user_id, e.patient_name);
      }
      const { data: orderRows } = await supabase.from("orders").select("user_id, patient_name").limit(500);
      for (const o of orderRows?.data || []) {
        if (o.user_id && o.patient_name) nameMap.set(o.user_id, o.patient_name);
      }
      setSavedNotes(mapSavedNotes((data || []) as Record<string, unknown>[], nameMap));
    } catch (err) {
      console.error(err);
    } finally {
      setNotesLoading(false);
    }
  }, [encounters]);

  useEffect(() => {
    fetchEncounters();
  }, [fetchEncounters]);

  useEffect(() => {
    fetchSavedNotes();
  }, [fetchSavedNotes]);

  useEffect(() => {
    const Win = window as Window & { SpeechRecognition?: new () => SpeechRecInstance; webkitSpeechRecognition?: new () => SpeechRecInstance };
    const Ctor = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    return () => rec.stop();
  }, []);

  const handleToggleRecording = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (!transcript.trim()) {
        toast.error("No audio captured.");
        return;
      }
      setIsProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-medical-scribe", {
          body: { transcript },
        });
        if (error) throw error;
        setSoapNote({
          subjective: data.subjective || transcript,
          objective: data.objective || "",
          assessment: data.assessment || "",
          plan: data.plan || "",
        });
        toast.success(data.is_fallback ? "Note structured (clinical engine)." : "AI structured your SOAP note.");
      } catch {
        setSoapNote({
          subjective: transcript,
          objective: selectedEncounter ? buildIntakePrefill(selectedEncounter).objective : "",
          assessment: "Clinical consultation — see subjective.",
          plan: "Follow up per protocol.",
        });
        toast.info("AI unavailable — transcript placed in Subjective.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      setTranscript("");
      recognitionRef.current?.start();
      setIsRecording(true);
      toast.info("Listening… speak clearly, then stop to generate SOAP.");
    }
  };

  const handlePrefillFromIntake = () => {
    if (!selectedEncounter) {
      toast.error("Select a patient encounter first.");
      return;
    }
    setSoapNote(buildIntakePrefill(selectedEncounter));
    toast.success("Prefilled from enrollment intake.");
  };

  const handleSave = async () => {
    if (!user) return;
    if (!soapNote.assessment.trim() && !soapNote.subjective.trim()) {
      toast.error("Add at least Subjective or Assessment before saving.");
      return;
    }
    const patientId = selectedEncounter?.user_id;
    if (!patientId) {
      toast.error("Selected encounter has no patient user_id — choose another encounter.");
      return;
    }
    setSaving(true);
    try {
      const meta = user.user_metadata || {};
      const doctorName = meta.first_name
        ? `Dr. ${meta.first_name} ${meta.last_name || ""}`.trim()
        : "Attending physician";
      const { error } = await supabase.from("visit_summaries").insert({
        patient_id: patientId,
        doctor_id: user.id,
        doctor_name: doctorName,
        specialty: selectedEncounter?.category || "Telehealth",
        diagnosis: serializeSoapToDiagnosis(soapNote),
        type: "video",
        date: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Clinical note saved to chart.");
      await fetchSavedNotes();
      setHubTab("library");
    } catch (err) {
      console.error(err);
      toast.error("Could not save — check visit_summaries table and RLS.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatFullSoapText(soapNote));
    toast.success("SOAP note copied.");
  };

  const filteredNotes = useMemo(() => {
    const q = noteSearch.trim().toLowerCase();
    return savedNotes.filter(
      (n) =>
        !q ||
        n.patientName.toLowerCase().includes(q) ||
        n.assessmentPreview.toLowerCase().includes(q) ||
        n.doctor_name?.toLowerCase().includes(q),
    );
  }, [savedNotes, noteSearch]);

  const selectedSaved = filteredNotes.find((n) => n.id === selectedNoteId) ?? filteredNotes[0] ?? null;

  const stats = useMemo(
    () => ({
      total: savedNotes.length,
      today: savedNotes.filter((n) => {
        const d = new Date(n.date);
        const t = new Date();
        return d.toDateString() === t.toDateString();
      }).length,
      words: soapWordCount(soapNote),
    }),
    [savedNotes, soapNote],
  );

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-16 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="Documentation"
        title="SOAP Notes & Clinical Notes"
        description="Ambient AI scribe, structured S.O.A.P editor, templates, and a searchable library synced to visit_summaries."
      >
        <Button
          variant="outline"
          className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20"
          onClick={() => {
            fetchEncounters();
            fetchSavedNotes();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Link
          to={`${doctorBase}/consult${selectedEncounter ? `?orderId=${encodeURIComponent(selectedEncounter.order_number || selectedEncounter.id)}` : ""}`}
          className="inline-flex items-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-2 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/25"
        >
          <Stethoscope className="h-4 w-4 mr-2" />
          Case workspace
        </Link>
      </DoctorPageHeader>

      {notesMissing && (
        <Card className="border-amber-300 bg-amber-50/90">
          <CardContent className="p-4 text-sm text-amber-950">
            Run <code className="font-mono text-xs bg-white px-1 rounded">supabase/fix_visit_summaries_rls.sql</code> in Supabase to enable saving and loading clinical notes.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Saved notes", value: stats.total, icon: FileText },
          { label: "Saved today", value: stats.today, icon: BookOpen },
          { label: "Draft word count", value: stats.words, icon: Bot },
        ].map((s) => (
          <Card key={s.label} className={doctorSurfaceCard}>
            <CardContent className="flex items-center gap-4 p-5">
              <s.icon className="h-6 w-6 text-emerald-700" />
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">{s.label}</p>
                <p className="text-2xl font-black text-[#0A2E1F]">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "compose", label: "Compose note" },
            { id: "library", label: "Note library" },
            { id: "templates", label: "Templates" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setHubTab(t.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-black uppercase border",
              hubTab === t.id ? "bg-[#0A2E1F] text-white border-[#0A2E1F]" : "bg-white text-slate-600 border-slate-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {hubTab === "compose" && (
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4 space-y-4">
            <Card className={doctorSurfaceCard}>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase text-[#0A2E1F]">Patient encounter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <select
                  value={selectedEncounterId}
                  onChange={(e) => setSelectedEncounterId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">Select encounter…</option>
                  {encounters.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.patient_name} — {e.medication}
                    </option>
                  ))}
                </select>
                {selectedEncounter && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs space-y-1">
                    <p className="font-bold text-[#0A2E1F]">{selectedEncounter.patient_name}</p>
                    <p className="text-slate-600">{selectedEncounter.medication}</p>
                    <p className="text-slate-500">{selectedEncounter.category}</p>
                  </div>
                )}
                <Button variant="outline" className="w-full rounded-xl text-xs font-bold" onClick={handlePrefillFromIntake}>
                  <ClipboardList className="h-3.5 w-3.5 mr-2" />
                  Prefill from intake
                </Button>
              </CardContent>
            </Card>

            <Card className={doctorSurfaceCard}>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase text-[#0A2E1F] flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  AI ambient scribe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  disabled={isProcessing}
                  className={cn(
                    "w-full rounded-2xl py-8 flex flex-col items-center gap-2 font-black uppercase text-xs transition-all",
                    isRecording
                      ? "bg-red-600 text-white shadow-lg"
                      : isProcessing
                        ? "bg-amber-500 text-white"
                        : "bg-[#0A2E1F] text-white hover:bg-emerald-900",
                  )}
                >
                  {isProcessing ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="h-10 w-10" />
                  ) : (
                    <Mic className="h-10 w-10" />
                  )}
                  {isProcessing ? "Structuring…" : isRecording ? "Stop & generate SOAP" : "Start recording"}
                </button>
                <div className="rounded-xl bg-slate-900 p-4 max-h-[160px] overflow-y-auto custom-scrollbar">
                  <p className="text-[11px] font-mono text-emerald-100/90 leading-relaxed">
                    {transcript || "// Transcript appears here…"}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500">
                  Uses <code className="text-xs">ai-medical-scribe</code> edge function when configured; falls back to clinical heuristics.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-8 space-y-4">
            <Card className={doctorSurfaceCard}>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base font-black text-[#0A2E1F]">SOAP documentation</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">{stats.words} words · {soapNote.assessment ? "Ready to sign" : "Draft"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => {
                      setSoapNote(emptySoapNote());
                      setTranscript("");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                  <Button
                    className="rounded-xl bg-[#0A2E1F] hover:bg-emerald-900 text-white font-bold"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Save to chart
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {SOAP_SECTIONS.map((section) => (
                    <div
                      key={section.key}
                      className={cn("rounded-2xl border p-4", section.color)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg border bg-white",
                            section.accent,
                          )}
                        >
                          {section.short}
                        </span>
                        <div>
                          <p className="text-sm font-black text-[#0A2E1F]">{section.label}</p>
                          <p className="text-[10px] text-slate-500">{section.hint}</p>
                        </div>
                        <Sparkles className="h-4 w-4 text-slate-300 ml-auto" />
                      </div>
                      <textarea
                        value={soapNote[section.key]}
                        onChange={(e) => setSoapNote((s) => ({ ...s, [section.key]: e.target.value }))}
                        placeholder={isProcessing ? "AI generating…" : `Enter ${section.label.toLowerCase()}…`}
                        className="w-full min-h-[140px] rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-sm text-[#0A0D14] resize-y focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={cn(doctorSurfaceCard, "border-dashed")}>
              <CardContent className="p-4">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Preview (export format)</p>
                <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {formatFullSoapText(soapNote)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {hubTab === "library" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className={cn(doctorSurfaceCard, "lg:col-span-4")}>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  placeholder="Search notes…"
                  className="pl-9 rounded-xl"
                />
              </div>
              <div className="max-h-[520px] overflow-y-auto space-y-2 custom-scrollbar">
                {notesLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">No saved notes yet.</p>
                ) : (
                  filteredNotes.map((n) => {
                    const active = selectedSaved?.id === n.id;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setSelectedNoteId(n.id)}
                        className={cn(
                          "w-full text-left rounded-xl border p-3 transition-all",
                          active ? "border-[#0A2E1F] bg-[#0A2E1F] text-white" : "border-slate-100 bg-white hover:border-emerald-200",
                        )}
                      >
                        <p className="font-bold text-sm truncate">{n.patientName}</p>
                        <p className={cn("text-[10px] mt-1 line-clamp-2", active ? "text-emerald-100" : "text-slate-600")}>
                          {n.assessmentPreview}
                        </p>
                        <p className={cn("text-[10px] mt-1", active ? "text-emerald-200" : "text-slate-400")}>
                          {formatNoteDate(n.date)} · {n.doctor_name || "—"}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-8">
            {selectedSaved ? (
              <Card className={doctorSurfaceCard}>
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-black text-[#0A2E1F]">{selectedSaved.patientName}</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatNoteDate(selectedSaved.date)} · {selectedSaved.specialty || "Telehealth"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl font-bold"
                    onClick={() => {
                      setSoapNote(selectedSaved.soap);
                      setHubTab("compose");
                      toast.success("Loaded into editor.");
                    }}
                  >
                    Edit in composer
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {SOAP_SECTIONS.map((s) => (
                    <div key={s.key} className={cn("rounded-xl border p-3", s.color)}>
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-1">{s.label}</p>
                      <p className="text-sm text-[#0A2E1F] whitespace-pre-wrap leading-relaxed">
                        {selectedSaved.soap[s.key] || "—"}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className={doctorSurfaceCard}>
                <CardContent className="py-16 text-center text-slate-500">Select a saved note to review.</CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {hubTab === "templates" && (
        <div className="grid gap-4 md:grid-cols-3">
          {NOTE_TEMPLATES.map((tpl) => (
            <Card key={tpl.id} className={doctorSurfaceCard}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  <p className="font-black text-[#0A2E1F]">{tpl.label}</p>
                </div>
                <p className="text-xs text-slate-600 line-clamp-4">{tpl.soap.assessment}</p>
                <Button
                  className="w-full rounded-xl bg-[#0A2E1F] text-white font-bold text-xs"
                  onClick={() => {
                    setSoapNote(tpl.soap);
                    setHubTab("compose");
                    toast.success(`Applied template: ${tpl.label}`);
                  }}
                >
                  Use template
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
