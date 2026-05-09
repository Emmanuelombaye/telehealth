import { useState, useEffect } from "react";
import { ShieldCheck, Upload, CheckCircle2, Clock, AlertCircle, Lock, Eye, Loader2 } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

export function IdentityPage() {
  const { user } = useAuthStore();
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('identity_verification')
          .select('*')
          .eq('user_id', user!.id)
          .maybeSingle();
        if (error) throw error;
        setVerification(data);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    }
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const isVerified = verification?.status === 'verified';
  const checklist = verification?.checklist || [
    { label: "Government-issued ID", status: "pending", detail: "Not uploaded" },
    { label: "Selfie / Liveness Check", status: "pending", detail: "Not completed" },
    { label: "Address Verification", status: "pending", detail: "Awaiting documents" },
    { label: "Two-Factor Authentication", status: "pending", detail: "Disabled" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">Identity Verification</h1>

      {/* Status banner */}
      <Card className={cn(
        "border-2",
        isVerified 
          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200" 
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-200"
      )}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0",
              isVerified ? "bg-emerald-100" : "bg-amber-100"
            )}>
              <ShieldCheck className={cn("h-7 w-7", isVerified ? "text-emerald-600" : "text-amber-600")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className={cn("font-bold", isVerified ? "text-emerald-800" : "text-amber-800")}>
                  {isVerified ? "Identity Verified" : "Verification Pending"}
                </p>
                <Badge className={cn("text-[10px]", isVerified ? "bg-emerald-500" : "bg-amber-500")}>
                  HIPAA Compliant
                </Badge>
              </div>
              {isVerified ? (
                <>
                  <p className="text-xs text-emerald-700 mt-0.5">Verified on {new Date(verification.verification_date).toLocaleDateString()} · Valid through {new Date(verification.expiry_date).toLocaleDateString()}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Verification ID: {verification.verification_id}</p>
                </>
              ) : (
                <p className="text-xs text-amber-700 mt-0.5">Complete the checklist below to verify your identity.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification steps */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-bold mb-1">Verification Checklist</p>
          {checklist.map((item: any, i: number) => (
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
                <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 shrink-0">Complete</Button>
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
