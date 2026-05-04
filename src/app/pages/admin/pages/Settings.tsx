import { Settings, Shield, Globe, Bell, CreditCard, Mail, Lock, ToggleLeft, ToggleRight, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../../components/ui/shared";
import { useState } from "react";

const sections = [
  {
    title: "Security", icon: Shield,
    settings: [
      { label: "Two-Factor Authentication (2FA)", desc: "Require 2FA for all admin accounts", enabled: true },
      { label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", enabled: true },
      { label: "IP Allowlist", desc: "Restrict admin access to approved IPs", enabled: false },
      { label: "Audit Log Retention", desc: "Keep audit logs for 7 years (HIPAA)", enabled: true },
    ]
  },
  {
    title: "Notifications", icon: Bell,
    settings: [
      { label: "Critical Security Alerts", desc: "Email + SMS for critical events", enabled: true },
      { label: "Daily Summary Report", desc: "Daily platform summary to admin email", enabled: true },
      { label: "New User Registrations", desc: "Notify on new doctor registrations", enabled: false },
    ]
  },
  {
    title: "Integrations", icon: Globe,
    settings: [
      { label: "Stripe Payments", desc: "Payment processing integration", enabled: true },
      { label: "Twilio SMS", desc: "SMS notifications and reminders", enabled: true },
      { label: "SendGrid Email", desc: "Transactional email service", enabled: true },
      { label: "EHR Integration (HL7 FHIR)", desc: "Electronic health records sync", enabled: false },
    ]
  },
];

export function AdminSettingsPage() {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.flatMap(s => s.settings.map(x => [`${s.title}-${x.label}`, x.enabled])))
  );

  const toggle = (key: string) => setStates(s => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">System Settings</h1>
        <Button size="sm" className="rounded-full gap-1.5 text-xs"><Save className="h-3.5 w-3.5" /> Save Changes</Button>
      </div>

      {/* General */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> General</CardTitle></CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {[{ label: "Platform Name", value: "Brandon Health" }, { label: "Support Email", value: "support@brandonhealth.com" }, { label: "Default Language", value: "English" }, { label: "Default Timezone", value: "UTC" }].map((f, i) => (
            <div key={i}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{f.label}</label>
              <input defaultValue={f.value} className="w-full mt-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary" />
            </div>
          ))}
        </CardContent>
      </Card>

      {sections.map(section => (
        <Card key={section.title}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <section.icon className="h-4 w-4 text-primary" /> {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1">
            {section.settings.map(setting => {
              const key = `${section.title}-${setting.label}`;
              return (
                <div key={key} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-semibold">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.desc}</p>
                  </div>
                  <button onClick={() => toggle(key)} className="shrink-0">
                    {states[key]
                      ? <ToggleRight className="h-7 w-7 text-primary" />
                      : <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                    }
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
