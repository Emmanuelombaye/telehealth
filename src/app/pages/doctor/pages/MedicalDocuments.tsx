import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  FolderOpen,
  FileText,
  Search,
  RefreshCw,
  Loader2,
  Upload,
  ExternalLink,
  FlaskConical,
  Stethoscope,
  AlertCircle,
  Eye,
  X,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { doctorPageContainer, doctorSurfaceCard } from "../../../../lib/doctorPortalUi";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";
import { isMissingTableError } from "../../../../lib/supabaseTableError";
import {
  DOCUMENT_TYPES,
  DOC_TYPE_STYLES,
  LAB_STATUS_STYLES,
  buildPatientNameMap,
  formatDocDate,
  mergeAndSortDocs,
  patientDisplayName,
  resolveDocumentUrl,
  type UnifiedMedicalDoc,
} from "../../../../lib/doctorDocuments";
import { toast } from "sonner";

type PatientOption = { user_id: string; patient_name: string; order_id: string };

type ViewTab = "all" | "uploads" | "labs" | "visits";

export function DoctorMedicalDocumentsPage() {
  const doctorBase = useDoctorPortalBase();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState<string | null>(null);
  const [docs, setDocs] = useState<UnifiedMedicalDoc[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [search, setSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openingUrl, setOpeningUrl] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPatientId, setUploadPatientId] = useState("");
  const [uploadType, setUploadType] = useState<string>("Other");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setTableMissing(null);
    try {
      const [ordersRes, uploadsRes, labsRes, visitsRes] = await Promise.all([
        supabase.from("orders").select("id, user_id, patient_name").order("created_at", { ascending: false }),
        supabase.from("patient_documents").select("*").order("created_at", { ascending: false }),
        supabase.from("lab_results").select("*").order("created_at", { ascending: false }),
        supabase.from("visit_summaries").select("*").order("date", { ascending: false }),
      ]);

      const nameMap = buildPatientNameMap(ordersRes.data ?? []);
      const patientOpts: PatientOption[] = [];
      const seen = new Set<string>();
      for (const row of ordersRes.data ?? []) {
        if (row.user_id && row.patient_name && row.id && !seen.has(row.user_id)) {
          seen.add(row.user_id);
          patientOpts.push({
            user_id: row.user_id,
            patient_name: row.patient_name,
            order_id: row.id,
          });
        }
      }
      setPatients(patientOpts);

      const unified: UnifiedMedicalDoc[] = [];

      if (uploadsRes.error && isMissingTableError(uploadsRes.error)) {
        setTableMissing("patient_documents");
      } else if (uploadsRes.error) {
        console.warn(uploadsRes.error);
      } else {
        for (const d of uploadsRes.data ?? []) {
          unified.push({
            id: `upload-${d.id}`,
            source: "upload",
            patientId: d.patient_id,
            patientName: patientDisplayName(d.patient_id, nameMap),
            title: d.name,
            subtitle: d.type ?? "Other",
            typeLabel: d.type ?? "Other",
            createdAt: d.created_at ?? new Date().toISOString(),
            isNew: d.new === true,
            url: d.url,
            storagePath: d.storage_path,
            size: d.size,
          });
        }
      }

      if (!labsRes.error) {
        for (const l of labsRes.data ?? []) {
          unified.push({
            id: `lab-${l.id}`,
            source: "lab",
            patientId: l.patient_id,
            patientName: patientDisplayName(l.patient_id, nameMap),
            title: l.panel_name ?? "Lab panel",
            subtitle: l.ordered_by ?? "Ordered by care team",
            typeLabel: "Lab panel",
            createdAt: l.created_at ?? new Date().toISOString(),
            isNew: l.status === "new",
            url: l.report_url,
            storagePath: null,
            status: l.status,
            payload: { tests: l.tests },
          });
        }
      }

      if (!visitsRes.error) {
        for (const v of visitsRes.data ?? []) {
          unified.push({
            id: `visit-${v.id}`,
            source: "visit",
            patientId: v.patient_id,
            patientName: patientDisplayName(v.patient_id, nameMap),
            title: v.doctor_name ? `Visit — ${v.doctor_name}` : "Visit summary",
            subtitle: v.specialty ?? v.type ?? "Consultation",
            typeLabel: "Visit summary",
            createdAt: v.date ?? v.created_at ?? new Date().toISOString(),
            isNew: false,
            url: v.report_url,
            storagePath: null,
            payload: {
              diagnosis: v.diagnosis,
              follow_up_date: v.follow_up_date,
              type: v.type,
            },
          });
        }
      }

      setDocs(mergeAndSortDocs(unified));
    } catch (err) {
      console.error(err);
      toast.error("Could not load medical documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAll();
    const ch = supabase
      .channel("doctor-documents-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_documents" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "lab_results" }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchAll]);

  const stats = useMemo(() => {
    const uploads = docs.filter((d) => d.source === "upload");
    return {
      total: docs.length,
      newUploads: uploads.filter((d) => d.isNew).length,
      labs: docs.filter((d) => d.source === "lab").length,
      visits: docs.filter((d) => d.source === "visit").length,
    };
  }, [docs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      if (viewTab === "uploads" && d.source !== "upload") return false;
      if (viewTab === "labs" && d.source !== "lab") return false;
      if (viewTab === "visits" && d.source !== "visit") return false;
      if (patientFilter !== "all" && d.patientId !== patientFilter) return false;
      if (typeFilter !== "all" && d.typeLabel !== typeFilter && d.subtitle !== typeFilter) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.patientName.toLowerCase().includes(q) ||
        d.typeLabel.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q)
      );
    });
  }, [docs, search, patientFilter, typeFilter, viewTab]);

  const selected = filtered.find((d) => d.id === selectedId) ?? filtered[0] ?? null;

  const patientOrderId = useMemo(() => {
    if (!selected?.patientId) return null;
    return patients.find((p) => p.user_id === selected.patientId)?.order_id ?? null;
  }, [selected?.patientId, patients]);

  async function handleOpenDocument(doc: UnifiedMedicalDoc) {
    setOpeningUrl(true);
    try {
      const url = await resolveDocumentUrl(doc.storagePath, doc.url);
      if (!url) {
        toast.error("No file URL available for this document.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open document.");
    } finally {
      setOpeningUrl(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadPatientId) {
      toast.error("Select a patient before uploading.");
      return;
    }
    setUploading(true);
    try {
      const path = `${uploadPatientId}/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage
        .from("patient-documents")
        .upload(path, file);
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from("patient-documents").getPublicUrl(path);

      const { error: insertError } = await supabase.from("patient_documents").insert({
        patient_id: uploadPatientId,
        name: file.name,
        type: uploadType,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        url: urlData.publicUrl,
        storage_path: path,
        new: true,
      });
      if (insertError) throw insertError;

      toast.success("Document uploaded for patient chart.");
      setShowUpload(false);
      await fetchAll();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Check storage bucket and RLS policies.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const tests = (selected?.payload?.tests as { name?: string; value?: string; unit?: string; range?: string; status?: string }[]) ?? [];

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-16 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="Records & imaging"
        title="Medical Documents"
        description="Patient uploads, lab panels, and visit summaries — connected to your Supabase clinical record store."
      >
        <Button
          variant="outline"
          className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20"
          onClick={() => fetchAll()}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
        <Button
          className="rounded-xl bg-[#D4AF37] text-[#0A2E1F] hover:bg-[#c4a030] font-bold"
          onClick={() => setShowUpload(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload for patient
        </Button>
      </DoctorPageHeader>

      {tableMissing && (
        <div className={cn(doctorSurfaceCard, "border-amber-200 bg-amber-50/80 p-4 flex gap-3")}>
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900">
            Table <code className="font-mono text-xs bg-white px-1 rounded">patient_documents</code> is not in this database yet.
            Run <code className="font-mono text-xs bg-white px-1 rounded">supabase_doctor_clinical_policies.sql</code> in Supabase.
            Lab results and visit summaries may still appear below.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total records", value: stats.total, icon: FolderOpen },
          { label: "New patient uploads", value: stats.newUploads, icon: FileText },
          { label: "Lab panels", value: stats.labs, icon: FlaskConical },
          { label: "Visit summaries", value: stats.visits, icon: Stethoscope },
        ].map((s) => (
          <Card key={s.label} className={doctorSurfaceCard}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800">
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
                <p className="text-2xl font-black text-[#0A2E1F]">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "all", label: "All records" },
            { id: "uploads", label: "Patient uploads" },
            { id: "labs", label: "Lab results" },
            { id: "visits", label: "Visit summaries" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setViewTab(tab.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider border transition-colors",
              viewTab === tab.id
                ? "bg-[#0A2E1F] text-white border-[#0A2E1F]"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className={cn(doctorSurfaceCard, "lg:col-span-4")}>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, patient, type…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-[#0A0D14] focus:outline-none focus:border-emerald-600"
              />
            </div>
            <select
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0A0D14] focus:outline-none focus:border-emerald-600"
            >
              <option value="all">All patients</option>
              {patients.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.patient_name}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0A0D14] focus:outline-none focus:border-emerald-600"
            >
              <option value="all">All document types</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value="Lab panel">Lab panel</option>
              <option value="Visit summary">Visit summary</option>
            </select>

            <div className="max-h-[480px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {loading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No documents match your filters.</p>
              ) : (
                filtered.map((doc) => {
                  const active = selected?.id === doc.id;
                  const style = DOC_TYPE_STYLES[doc.typeLabel] ?? DOC_TYPE_STYLES.Other;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedId(doc.id)}
                      className={cn(
                        "w-full text-left rounded-xl border p-3 transition-all",
                        active
                          ? "border-[#0A2E1F] bg-[#0A2E1F] text-white shadow-md"
                          : "border-slate-100 bg-white hover:border-emerald-200",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm truncate">{doc.title}</p>
                        {doc.isNew && (
                          <Badge
                            className={cn(
                              "shrink-0 text-[8px] font-black uppercase",
                              active ? "bg-amber-400 text-[#0A2E1F]" : "bg-amber-100 text-amber-800",
                            )}
                          >
                            New
                          </Badge>
                        )}
                      </div>
                      <p className={cn("text-[10px] mt-1 truncate", active ? "text-emerald-100" : "text-slate-500")}>
                        {doc.patientName}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                            active ? "bg-white/15 text-white border-white/20" : style.badge,
                          )}
                        >
                          {doc.typeLabel}
                        </span>
                        <span className={cn("text-[10px]", active ? "text-emerald-200" : "text-slate-400")}>
                          {formatDocDate(doc.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-8">
          {selected ? (
            <Card className={doctorSurfaceCard}>
              <CardHeader className="border-b border-emerald-100/80 bg-gradient-to-r from-white to-emerald-50/40">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-lg font-black text-[#0A2E1F] truncate">{selected.title}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-700" />
                      {selected.patientName}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {formatDocDate(selected.createdAt)} · {selected.subtitle}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Badge
                      className={cn(
                        "rounded-lg border text-[10px] font-black uppercase",
                        DOC_TYPE_STYLES[selected.typeLabel]?.badge ?? DOC_TYPE_STYLES.Other.badge,
                      )}
                    >
                      {selected.typeLabel}
                    </Badge>
                    {selected.status && (
                      <Badge
                        className={cn(
                          "rounded-lg border text-[10px] font-black uppercase",
                          LAB_STATUS_STYLES[selected.status] ?? LAB_STATUS_STYLES.pending,
                        )}
                      >
                        {selected.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {selected.source === "visit" && selected.payload?.diagnosis != null && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-2">
                      Diagnosis / assessment
                    </p>
                    <p className="text-sm font-semibold text-[#0A2E1F] leading-relaxed">
                      {String(selected.payload.diagnosis)}
                    </p>
                    {selected.payload.follow_up_date != null && (
                      <p className="text-xs text-indigo-700 mt-2 font-medium">
                        Follow-up: {formatDocDate(String(selected.payload.follow_up_date))}
                      </p>
                    )}
                  </div>
                )}

                {selected.source === "lab" && tests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Panel results</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {tests.map((test, i) => (
                        <div
                          key={i}
                          className={cn(
                            "rounded-xl border p-3",
                            test.status === "high" || test.status === "low"
                              ? "border-amber-200 bg-amber-50"
                              : "border-slate-100 bg-slate-50/80",
                          )}
                        >
                          <p className="text-sm font-bold text-[#0A2E1F]">{test.name}</p>
                          <p className="text-sm font-semibold text-emerald-800 mt-0.5">
                            {test.value} {test.unit}
                          </p>
                          {test.range && (
                            <p className="text-[10px] text-slate-500 mt-1">Ref: {test.range}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.size && (
                  <p className="text-xs text-slate-500 font-medium">File size: {selected.size}</p>
                )}

                <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                  {(selected.url || selected.storagePath) && (
                    <Button
                      className="rounded-xl bg-[#0A2E1F] hover:bg-emerald-900 text-white font-bold"
                      onClick={() => handleOpenDocument(selected)}
                      disabled={openingUrl}
                    >
                      {openingUrl ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Open document
                    </Button>
                  )}
                  {patientOrderId && (
                    <Link
                      to={`${doctorBase}/patients/${patientOrderId}`}
                      className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#0A2E1F] hover:border-emerald-300"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Patient chart
                    </Link>
                  )}
                  <Link
                    to={`${doctorBase}/consult`}
                    className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100"
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Case workspace
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className={doctorSurfaceCard}>
              <CardContent className="py-20 text-center">
                <FolderOpen className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
                <p className="font-bold text-[#0A2E1F]">Select a document to preview</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Patient uploads sync from the <code className="text-xs">patient_documents</code> table; labs and visit notes load automatically.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50">
              <CardTitle className="text-base font-black text-[#0A2E1F]">Upload for patient</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Patient</label>
                <select
                  value={uploadPatientId}
                  onChange={(e) => setUploadPatientId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.patient_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Document type</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <label className={cn("block", (!uploadPatientId || uploading) && "opacity-60 pointer-events-none")}>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2E1F] text-white py-3 text-sm font-bold cursor-pointer hover:bg-emerald-900">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading…" : "Choose file"}
                </span>
              </label>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
