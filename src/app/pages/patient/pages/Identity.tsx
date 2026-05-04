import { ShieldCheck, Upload, CheckCircle2, Clock, AlertCircle, Lock, Eye } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared";

export function IdentityPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">Identity Verification</h1>

      {/* Status banner */}
      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-emerald-800 dark:text-emerald-300">Identity Verified</p>
                <Badge className="bg-emerald-500 text-white text-[10px]">HIPAA Compliant</Badge>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Verified on Jan 15, 2026 · Valid through Dec 31, 2026</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Verification ID: VRF-2026-00492-BH</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification steps */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-bold mb-1">Verification Checklist</p>
          {[
            { label: "Government-issued ID", status: "verified", detail: "Passport — Expires 2030" },
            { label: "Selfie / Liveness Check", status: "verified", detail: "Completed Jan 15, 2026" },
            { label: "Address Verification", status: "verified", detail: "123 Main St, New York" },
            { label: "Insurance Verification", status: "verified", detail: "BlueCross BlueShield" },
            { label: "Two-Factor Authentication", status: "pending", detail: "Enable for extra security" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              {item.status === "verified"
                ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                : <Clock className="h-5 w-5 text-amber-500 shrink-0" />
              }
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              {item.status === "pending" && (
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 shrink-0">Enable</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-bold">Privacy & Data Rights</p>
          {[
            { icon: Lock, label: "Data Encryption", desc: "All your data is AES-256 encrypted at rest and in transit." },
            { icon: Eye, label: "Access Log", desc: "View who has accessed your medical records." },
            { icon: ShieldCheck, label: "HIPAA Rights", desc: "Request data export or deletion at any time." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Button size="sm" variant="ghost" className="text-xs text-primary shrink-0">View</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
