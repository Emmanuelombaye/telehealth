import { useState, useEffect } from "react";
import { FileText, Download, Upload, Search, FolderOpen, Loader2 } from "lucide-react";
import { Card, CardContent, Button } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

const typeColors: Record<string, string> = {
  "Lab Report":   "bg-violet-100 text-violet-700",
  "Diagnostic":   "bg-purple-100 text-purple-700",
  "Prescription": "bg-emerald-100 text-emerald-700",
  "Insurance":    "bg-amber-100 text-amber-700",
  "Immunization": "bg-rose-100 text-rose-700",
  "Referral":     "bg-slate-100 text-slate-700",
  "Other":        "bg-blue-100 text-blue-700",
};

export function DocumentsPage() {
  const { user } = useAuthStore();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchDocs();
  }, [user]);

  async function fetchDocs() {
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', user!.id)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setDocs(data || []);
    } catch (err) {
      console.error("Documents fetch error:", err);
    } finally { setLoading(false); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage.from('patient-documents').upload(path, file);
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from('patient-documents').getPublicUrl(path);

      await supabase.from('patient_documents').insert({
        patient_id: user.id,
        name: file.name,
        type: 'Other',
        size: `${(file.size / 1024).toFixed(0)} KB`,
        url: urlData.publicUrl,
        storage_path: path,
        new: true,
      });

      await fetchDocs();
    } catch (err) {
      console.error("Upload error:", err);
    } finally { setUploading(false); }
  }

  const filtered = docs.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Documents</h1>
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          <Button size="sm" className="rounded-full gap-1.5 text-xs pointer-events-none" disabled={uploading}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </label>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-300"
          aria-hidden
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
          placeholder="Search documents..."
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-900/40">
          <CardContent className="p-10 text-center">
            <FolderOpen
              className="mx-auto mb-3 h-10 w-10 text-emerald-700 dark:text-emerald-400"
              aria-hidden
            />
            <h3 className="font-bold text-slate-900 dark:text-slate-50">
              {search ? "No results found" : "No documents yet"}
            </h3>
            <p className="mt-2 max-w-sm mx-auto text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {search
                ? "Try a different search term."
                : "Upload your medical documents for your care team to review."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <Card key={doc.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{doc.name}</p>
                      {doc.new && <span className="text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full shrink-0">NEW</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[doc.type] || "bg-muted text-muted-foreground"}`}>{doc.type}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''} · {doc.size || '—'}
                      </span>
                    </div>
                  </div>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl shrink-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
