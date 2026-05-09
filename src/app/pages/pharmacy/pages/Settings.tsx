import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save, Loader2, KeyRound, Building2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

type Settings = {
  pharmacy_name: string;
  npi: string;
  dea_number: string;
  license_number: string;
  license_state: string;
  default_carrier: string;
  surescripts_account: string;
  notify_email: string;
  notify_low_stock: boolean;
  auto_print_labels: boolean;
};

const blank: Settings = {
  pharmacy_name: "", npi: "", dea_number: "", license_number: "", license_state: "",
  default_carrier: "UPS", surescripts_account: "", notify_email: "", notify_low_stock: true, auto_print_labels: false,
};

export function PharmacySettingsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<Settings>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: row } = await supabase.from('pharmacy_settings').select('*').eq('user_id', user.id).maybeSingle();
      if (row) setData({ ...blank, ...row });
      setLoading(false);
    })();
  }, [user?.id]);

  async function save() {
    if (!user) return;
    setSaving(true); setSaved(false);
    try {
      const { error } = await supabase.from('pharmacy_settings')
        .upsert({ user_id: user.id, ...data }, { onConflict: 'user_id' });
      if (error) throw error;
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || "Save failed (you may need to apply the pharmacy_settings migration).");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon className="h-6 w-6 text-primary" /> Pharmacy Settings</h1>
          <p className="text-sm text-muted-foreground">Dispensary credentials and integration preferences.</p>
        </div>
        <Button className="rounded-xl" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save
        </Button>
      </div>

      {saved && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="p-3 text-sm flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Settings saved.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Dispensary</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Field label="Pharmacy name" value={data.pharmacy_name} onChange={v => setData({ ...data, pharmacy_name: v })} />
          <Field label="NPI" value={data.npi} onChange={v => setData({ ...data, npi: v })} />
          <Field label="DEA number" value={data.dea_number} onChange={v => setData({ ...data, dea_number: v })} />
          <Field label="State license #" value={data.license_number} onChange={v => setData({ ...data, license_number: v })} />
          <Field label="Licensed state" value={data.license_state} onChange={v => setData({ ...data, license_state: v })} />
          <Field label="Notification email" value={data.notify_email} onChange={v => setData({ ...data, notify_email: v })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Integrations</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Default carrier</label>
            <select value={data.default_carrier} onChange={e => setData({ ...data, default_carrier: e.target.value })}
              className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary">
              <option>UPS</option><option>FedEx</option><option>USPS</option><option>DHL</option>
            </select>
          </div>
          <Field label="SureScripts account" value={data.surescripts_account} onChange={v => setData({ ...data, surescripts_account: v })} />
          <Toggle label="Notify on low stock" value={data.notify_low_stock} onChange={v => setData({ ...data, notify_low_stock: v })} />
          <Toggle label="Auto-print shipping labels" value={data.auto_print_labels} onChange={v => setData({ ...data, auto_print_labels: v })} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</label>
      <input value={value || ""} onChange={e => onChange(e.target.value)}
        className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between border border-border rounded-xl px-3 py-2.5 cursor-pointer hover:bg-muted/30">
      <span className="text-sm font-medium">{label}</span>
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
    </label>
  );
}
