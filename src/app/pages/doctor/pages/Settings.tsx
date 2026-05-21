import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  User,
  Shield,
  Bell,
  Calendar,
  Stethoscope,
  Save,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Lock,
  ExternalLink,
  CheckCircle2,
  BadgeCheck,
  Copy,
  LogOut,
  Sparkles,
  Activity,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { doctorPageContainer, doctorSurfaceCard, doctorInsetCard } from "../../../../lib/doctorPortalUi";
import { useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { useAuthStore, usePatientStore } from "../../../../lib";
import { useDoctorClinicalMetrics } from "../../../../lib/doctorClinicalMetrics";
import {
  DEFAULT_NOTIFICATION_PREFS,
  fetchDoctorProfile,
  fetchDoctorSchedule,
  LANGUAGE_OPTIONS,
  mergeDoctorProfile,
  profileInitials,
  saveDoctorProfile,
  saveDoctorSchedulePrefs,
  updateDoctorPassword,
  US_TIMEZONES,
  type DoctorNotificationPrefs,
  type DoctorProfileForm,
  type DoctorScheduleSnapshot,
} from "../../../../lib/doctorSettings";
import { toast } from "sonner";

type SettingsTab = "profile" | "credentials" | "scheduling" | "notifications" | "security";

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "credentials", label: "Credentials", icon: Stethoscope },
  { id: "scheduling", label: "Scheduling", icon: Calendar },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

const NOTIF_TOGGLES: { key: keyof DoctorNotificationPrefs; label: string; desc: string }[] = [
  { key: "queueAlerts", label: "Clinical queue", desc: "New reviews and follow-up cases" },
  { key: "labResults", label: "Lab results", desc: "New and pending panels" },
  { key: "messages", label: "Secure messages", desc: "Patient and care-team inbox" },
  { key: "videoVisits", label: "Video visits", desc: "Scheduling requests and confirmations" },
  { key: "rpmVitals", label: "RPM & vitals", desc: "Critical out-of-range readings" },
  { key: "emailDigest", label: "Weekly digest", desc: "Email summary of portal activity" },
];

export function DoctorSettingsPage() {
  const doctorBase = useDoctorPortalBase();
  const { user, signOut } = useAuthStore();
  const metrics = useDoctorClinicalMetrics();
  const { unreadMessagesCount } = usePatientStore();

  const [tab, setTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DoctorProfileForm | null>(null);
  const [form, setForm] = useState<DoctorProfileForm | null>(null);
  const [scheduleSnap, setScheduleSnap] = useState<DoctorScheduleSnapshot | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [row, sched] = await Promise.all([
        fetchDoctorProfile(user.id),
        fetchDoctorSchedule(user.id),
      ]);
      const merged = mergeDoctorProfile(user, row);
      setProfile(merged);
      setForm(merged);
      setScheduleSnap(sched);
    } catch (err) {
      console.error(err);
      toast.error("Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!profile || !form) return false;
    return JSON.stringify(profile) !== JSON.stringify(form);
  }, [profile, form]);

  const patch = (partial: Partial<DoctorProfileForm>) => {
    setForm((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const patchPref = (key: keyof DoctorNotificationPrefs, value: boolean) => {
    setForm((prev) =>
      prev ? { ...prev, notificationPrefs: { ...prev.notificationPrefs, [key]: value } } : prev,
    );
  };

  const handleDiscard = () => {
    if (!profile) return;
    setForm({ ...profile, notificationPrefs: { ...profile.notificationPrefs } });
    toast.message("Changes discarded.");
  };

  const handleSave = async () => {
    if (!user || !form) return;
    setSaving(true);
    try {
      await saveDoctorProfile(user, form);
      await saveDoctorSchedulePrefs(user.id, form, scheduleSnap);
      const saved = { ...form, notificationPrefs: { ...form.notificationPrefs } };
      setProfile(saved);
      setForm(saved);
      toast.success("Profile saved successfully.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await updateDoctorPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password update failed.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const copyCalendly = () => {
    if (!form?.calendlyUrl) return;
    navigator.clipboard.writeText(form.calendlyUrl);
    toast.success("Calendly URL copied.");
  };

  if (loading || !form) {
    return (
      <div className={doctorPageContainer}>
        <div className="flex flex-col items-center justify-center py-28">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 mt-4">Loading your profile…</p>
        </div>
      </div>
    );
  }

  const displayName = form.fullName || `Dr. ${form.firstName} ${form.lastName}`.trim();

  return (
    <div className={cn(doctorPageContainer, "space-y-6 pb-16 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="Account & practice"
        title="Settings & Profile"
        description="Manage your professional identity, licensing, scheduling links, notification preferences, and account security."
      >
        {dirty && (
          <>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="rounded-xl border border-amber-400/60 bg-amber-400/20 px-3 py-2 text-[10px] font-black uppercase text-amber-100 hover:bg-amber-400/35 transition-colors"
              title="Revert all edits on this page"
            >
              Unsaved changes · Discard
            </button>
            <Button
              className="rounded-xl bg-[#D4AF37]/90 text-[#0A2E1F] hover:bg-[#D4AF37] font-bold"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save changes
            </Button>
          </>
        )}
      </DoctorPageHeader>

      {/* Identity hero */}
      <Card className={cn(doctorSurfaceCard, "overflow-hidden")}>
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-[#0A2E1F] via-emerald-900 to-teal-900 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.15),transparent_50%)]" />
          <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="h-20 w-20 rounded-3xl bg-[#D4AF37]/20 border-2 border-[#D4AF37]/40 flex items-center justify-center text-2xl font-black text-[#D4AF37] shrink-0">
              {profileInitials(displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black tracking-tight">{displayName}</h2>
              <p className="text-emerald-100/90 text-sm mt-1 flex items-center gap-2 flex-wrap">
                <Mail className="h-3.5 w-3.5" />
                {form.email}
                {form.specialty && (
                  <>
                    <span className="text-white/30">·</span>
                    <Stethoscope className="h-3.5 w-3.5" />
                    {form.specialty}
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-white/15 text-white border-white/20 text-[10px] font-black uppercase">
                  {form.status === "active" ? "Active provider" : form.status}
                </Badge>
                {form.npiNumber && (
                  <Badge className="bg-[#D4AF37]/25 text-[#D4AF37] border-[#D4AF37]/40 text-[10px] font-black">
                    NPI {form.npiNumber}
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full sm:w-auto shrink-0">
              {[
                { label: "Queue", value: metrics.pendingDecision, icon: ClipboardList },
                { label: "Messages", value: unreadMessagesCount, icon: Mail },
                { label: "Attention", value: metrics.attentionLoad, icon: Activity },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-center min-w-[72px]">
                  <s.icon className="h-3.5 w-3.5 mx-auto text-emerald-200 mb-1" />
                  <p className="text-lg font-black">{s.value}</p>
                  <p className="text-[9px] font-bold uppercase text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Tab nav */}
        <Card className={cn(doctorSurfaceCard, "h-fit lg:sticky lg:top-4")}>
          <CardContent className="p-2 space-y-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                  tab === t.id
                    ? "bg-[#0A2E1F] text-white shadow-md"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-[#0A2E1F]",
                )}
              >
                <t.icon className="h-4 w-4 shrink-0" />
                {t.label}
              </button>
            ))}
            <div className="h-px bg-slate-100 my-2" />
            <Link
              to={`${doctorBase}/availability`}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
            >
              <Calendar className="h-4 w-4" />
              Weekly hours
              <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
            </Link>
            <Link
              to={`${doctorBase}/analytics`}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
            >
              <Sparkles className="h-4 w-4" />
              Analytics
              <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
            </Link>
          </CardContent>
        </Card>

        {/* Tab panels */}
        <div className="space-y-5">
          {tab === "profile" && (
            <SettingsSection title="Personal profile" description="Contact and display information shown across the physician portal.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" value={form.firstName} onChange={(v) => patch({ firstName: v, fullName: `${v} ${form.lastName}`.trim() })} />
                <Field label="Last name" value={form.lastName} onChange={(v) => patch({ lastName: v, fullName: `${form.firstName} ${v}`.trim() })} />
                <Field label="Display name" value={form.fullName} onChange={(v) => patch({ fullName: v })} className="sm:col-span-2" />
                <Field label="Phone" value={form.phone} onChange={(v) => patch({ phone: v })} icon={Phone} />
                <Field label="Date of birth" value={form.dateOfBirth} onChange={(v) => patch({ dateOfBirth: v })} type="date" />
                <Field label="Address" value={form.address} onChange={(v) => patch({ address: v })} icon={MapPin} className="sm:col-span-2" />
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">Language</label>
                  <select
                    value={form.language}
                    onChange={(e) => patch({ language: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500">Portal timezone</label>
                  <select
                    value={form.timezone}
                    onChange={(e) => patch({ timezone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {US_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                <Mail className="h-3.5 w-3.5" />
                Account email <span className="font-semibold text-slate-700">{form.email}</span> — change under Security if your IdP allows it.
              </p>
            </SettingsSection>
          )}

          {tab === "credentials" && (
            <SettingsSection
              title="Professional credentials"
              description="Licensing and identity used for e-prescribing, superadmin roster, and patient-facing visit summaries."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="NPI number" value={form.npiNumber} onChange={(v) => patch({ npiNumber: v })} placeholder="10-digit NPI" />
                <Field label="Specialty" value={form.specialty} onChange={(v) => patch({ specialty: v })} placeholder="e.g. Internal Medicine" />
                <Field label="Credentials" value={form.credentials} onChange={(v) => patch({ credentials: v })} placeholder="MD, DO, NP…" />
                <Field
                  label="Licensed states"
                  value={form.licensedStates}
                  onChange={(v) => patch({ licensedStates: v })}
                  placeholder="CA, NY, TX"
                  className="sm:col-span-2"
                />
                <Field
                  label="Avatar URL"
                  value={form.avatarUrl}
                  onChange={(v) => patch({ avatarUrl: v })}
                  placeholder="https://…"
                  className="sm:col-span-2"
                />
              </div>
              <div className={cn(doctorInsetCard, "p-4 flex items-start gap-3 mt-2")}>
                <BadgeCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  These fields sync to the <code className="text-[10px] bg-slate-100 px-1 rounded">profiles</code> table. If columns are missing in your Supabase project, run{" "}
                  <code className="text-[10px] bg-slate-100 px-1 rounded">scripts/sql/RUN_IN_SUPABASE_profiles_settings_columns.sql</code>.
                </p>
              </div>
            </SettingsSection>
          )}

          {tab === "scheduling" && (
            <SettingsSection title="Scheduling & calendar" description="Calendly embed for Schedule page and booking deep links.">
              <Field
                label="Calendly scheduling URL"
                value={form.calendlyUrl}
                onChange={(v) => patch({ calendlyUrl: v })}
                placeholder="https://calendly.com/your-link"
                className="w-full"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={copyCalendly} disabled={!form.calendlyUrl}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy URL
                </Button>
                <Link to={`${doctorBase}/schedule`}>
                  <Button type="button" variant="outline" size="sm" className="rounded-xl">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Open schedule
                  </Button>
                </Link>
                <Link to={`${doctorBase}/availability`}>
                  <Button type="button" variant="outline" size="sm" className="rounded-xl">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    Weekly availability
                  </Button>
                </Link>
              </div>
              {scheduleSnap && (
                <div className="grid gap-3 sm:grid-cols-3 mt-4">
                  <StatChip label="Timezone" value={scheduleSnap.timezone.replace("_", " ")} />
                  <StatChip label="Buffer" value={`${scheduleSnap.bufferMins} min`} />
                  <StatChip
                    label="Consult modes"
                    value={[scheduleSnap.consultVideo && "Video", scheduleSnap.consultAsync && "Async"].filter(Boolean).join(" · ") || "—"}
                  />
                </div>
              )}
            </SettingsSection>
          )}

          {tab === "notifications" && (
            <SettingsSection title="Notification preferences" description="Controls stored in your auth session metadata and honored by the alerts hub.">
              <div className="space-y-3">
                {NOTIF_TOGGLES.map((t) => (
                  <ToggleRow
                    key={t.key}
                    label={t.label}
                    description={t.desc}
                    checked={form.notificationPrefs[t.key]}
                    onChange={(v) => patchPref(t.key, v)}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 text-xs font-bold text-slate-500"
                onClick={() => patch({ notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS } })}
              >
                Reset to defaults
              </Button>
              <Link
                to={`${doctorBase}/notifications`}
                className="inline-flex mt-4 text-sm font-bold text-emerald-800 hover:underline items-center gap-1"
              >
                Open alerts hub
                <ChevronLink />
              </Link>
            </SettingsSection>
          )}

          {tab === "security" && (
            <>
              <SettingsSection title="Password" description="Update your portal sign-in password (min. 8 characters).">
                <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                  <Field
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    type="password"
                    placeholder="••••••••"
                  />
                  <Field
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  className="mt-4 rounded-xl bg-[#0A2E1F] hover:bg-emerald-900"
                  onClick={handlePassword}
                  disabled={passwordSaving || !newPassword}
                >
                  {passwordSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Update password
                </Button>
              </SettingsSection>

              <SettingsSection title="Session" description="Sign out of this device. Your clinical data remains in Supabase.">
                <div className={cn(doctorInsetCard, "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
                  <div>
                    <p className="text-sm font-bold text-[#0A2E1F]">Signed in as</p>
                    <p className="text-xs text-slate-500 mt-1">{form.email}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono truncate max-w-md">ID {user?.id}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 shrink-0"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </SettingsSection>
            </>
          )}

          {dirty && (
            <div className="sticky bottom-4 flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-slate-300 bg-white font-bold"
                onClick={handleDiscard}
                disabled={saving}
              >
                Discard
              </Button>
              <Button
                className="rounded-xl shadow-lg bg-[#0A2E1F] hover:bg-emerald-900 font-bold px-6"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Save all changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className={doctorSurfaceCard}>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-black text-[#0A2E1F]">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: typeof Mail;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[10px] font-black uppercase text-slate-500">{label}</label>
      <div className="relative mt-1">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("rounded-xl", Icon && "pl-9")}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={cn(doctorInsetCard, "flex items-center justify-between gap-4 p-4")}>
      <div>
        <p className="text-sm font-bold text-[#0A2E1F]">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors shrink-0",
          checked ? "bg-emerald-600" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className={doctorInsetCard + " p-3 text-center"}>
      <p className="text-[10px] font-black uppercase text-slate-500">{label}</p>
      <p className="text-sm font-bold text-[#0A2E1F] mt-1 truncate">{value}</p>
    </div>
  );
}

function ChevronLink() {
  return <ExternalLink className="h-3.5 w-3.5" />;
}
