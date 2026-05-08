import { useState, useEffect } from "react";
import { Camera, Edit2, Save, Globe, Phone, Mail, MapPin, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

export function ProfilePage() {
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        const merged = {
          full_name: data?.full_name || user.user_metadata?.full_name || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 'Patient',
          email: data?.email || user.email || '',
          phone: data?.phone || user.user_metadata?.phone || '',
          address: data?.address || user.user_metadata?.address || '',
          date_of_birth: data?.date_of_birth || user.user_metadata?.date_of_birth || '',
          language: data?.language || 'English',
          blood_type: data?.blood_type || '',
          height: data?.height || '',
          weight: data?.weight || '',
          allergies: data?.allergies || '',
          emergency_contact: data?.emergency_contact || '',
          avatar_initials: ((data?.full_name || user.user_metadata?.full_name || 'P').split(' ').map((n: string) => n[0]).join('').slice(0, 2)).toUpperCase(),
          role: data?.role || 'patient',
        };
        setProfile(merged);
        setForm(merged);
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        date_of_birth: form.date_of_birth,
        language: form.language,
        blood_type: form.blood_type,
        height: form.height,
        weight: form.weight,
        allergies: form.allergies,
        emergency_contact: form.emergency_contact,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setProfile(form);
      setEditing(false);
    } catch (err) {
      console.error("Profile save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const field = (label: string, key: string, icon?: any) => (
    <div className="flex items-center gap-3" key={key}>
      {icon && <div className="h-8 w-8 shrink-0" >{(() => { const Icon = icon; return <Icon className="h-4 w-4 text-muted-foreground mt-2" />; })()}</div>}
      <div className="flex-1">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
        {editing
          ? <input value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
              className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:border-primary mt-0.5" />
          : <p className="text-sm font-medium mt-0.5">{profile?.[key] || <span className="text-muted-foreground italic">Not set</span>}</p>
        }
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Profile</h1>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => { setForm(profile); setEditing(false); }}>Cancel</Button>
            <Button size="sm" className="rounded-full gap-1.5 text-xs" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={() => setEditing(true)}>
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
      </div>

      {/* Avatar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
                {profile?.avatar_initials || 'P'}
              </div>
              {editing && (
                <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">{profile?.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px] capitalize">{profile?.role}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {field("Full Name", "full_name")}
          {field("Date of Birth", "date_of_birth", Calendar)}
          {field("Phone", "phone", Phone)}
          {field("Address", "address", MapPin)}
          {field("Language", "language", Globe)}
        </CardContent>
      </Card>

      {/* Medical Info */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {field("Blood Type", "blood_type")}
          {field("Height", "height")}
          {field("Weight", "weight")}
          {field("Allergies", "allergies")}
          {field("Emergency Contact", "emergency_contact")}
        </CardContent>
      </Card>
    </div>
  );
}
