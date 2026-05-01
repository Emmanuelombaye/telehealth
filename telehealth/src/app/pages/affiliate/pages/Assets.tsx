import { FileText, Download, Copy, Image as ImageIcon, Link2, Check } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared";

export function AffiliateAssetsPage() {
  const [copied, setCopied] = useState(false);
  const refLink = "https://brandonhealth.app/ref/AFF-00142";

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const assets = [
    { title: "Referral Banner – Desktop", type: "Image", size: "1200×628px", format: "PNG" },
    { title: "Referral Banner – Mobile", type: "Image", size: "600×314px", format: "PNG" },
    { title: "Social Media Post – Square", type: "Image", size: "1080×1080px", format: "PNG" },
    { title: "Email Template – Patient Invite", type: "HTML Template", size: "—", format: "HTML" },
    { title: "Brand Guidelines & Logos", type: "Document", size: "—", format: "PDF" },
    { title: "Affiliate Program Overview", type: "Document", size: "—", format: "PDF" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-orange-500" /> Marketing Assets</h1>
        <p className="text-sm text-muted-foreground">Download branded materials and share your unique referral link.</p>
      </div>

      {/* Referral Link Card */}
      <Card className="border-2 border-orange-200 bg-orange-50/40">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="h-5 w-5 text-orange-500" /> Your Referral Link</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Share this link with potential patients. You earn a commission for every confirmed sign-up.</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-background border border-border rounded-xl px-4 py-3 font-mono text-sm text-muted-foreground truncate">{refLink}</div>
            <Button onClick={handleCopy} className={`rounded-xl shrink-0 ${copied ? "bg-emerald-500 hover:bg-emerald-600" : "bg-orange-500 hover:bg-orange-600"}`}>
              {copied ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy Link</>}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-5">
            {[
              { label: "Link Clicks", value: "1,284" },
              { label: "Sign-ups", value: "38" },
              { label: "Conversion Rate", value: "2.96%" },
            ].map((s, i) => (
              <div key={i} className="text-center bg-background rounded-xl border border-border p-3">
                <p className="text-xl font-extrabold text-orange-500">{s.value}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Downloadable Assets */}
      <Card>
        <CardHeader className="border-b pb-3"><CardTitle>Downloadable Assets</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border">
          {assets.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  {a.type === "Image" ? <ImageIcon className="h-5 w-5 text-orange-500" /> : <FileText className="h-5 w-5 text-orange-500" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.type}{a.size !== "—" ? ` · ${a.size}` : ""} · {a.format}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-2"><Download className="h-4 w-4" /> Download</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
