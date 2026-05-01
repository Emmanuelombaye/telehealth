import { Receipt, Search, FileCheck, AlertCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../../components/ui/shared";

export function DoctorBillingPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" /> Coding & Billing Assistant
          </h1>
          <p className="text-sm text-muted-foreground">AI-assisted ICD-10 & CPT coding and claim submission.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Encounters Missing Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { patient: "Alice Thompson", date: "Today, 10:30 AM", type: "Video Consult (Follow-up)" },
                { patient: "Robert Wilson", date: "Yesterday, 2:15 PM", type: "Video Consult (Initial)" },
              ].map((enc, i) => (
                <div key={i} className={`p-4 border border-border rounded-xl cursor-pointer transition-colors ${i === 0 ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">{enc.patient}</p>
                      <p className="text-xs text-muted-foreground">{enc.date} • {enc.type}</p>
                    </div>
                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">Needs Coding</Badge>
                  </div>
                  {i === 0 && (
                    <div className="mt-3 p-3 bg-background rounded-lg border text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">AI Suggestion based on notes:</span><br/>
                      Primary Diagnosis: Essential (primary) hypertension (I10)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Code Selection</span>
              <span className="text-xs font-normal text-muted-foreground">Patient: Alice Thompson</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Diagnosis Codes (ICD-10)</label>
              <div className="relative mt-2 mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search ICD-10..." 
                  className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border-blue-200 cursor-pointer">
                  I10 (Hypertension) <span className="ml-2 text-blue-400">×</span>
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Procedure Codes (CPT)</label>
              <div className="relative mt-2 mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search CPT..." 
                  className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="px-3 py-1 text-sm bg-purple-50 text-purple-700 border-purple-200 cursor-pointer">
                  99213 (Est. Patient Level 3) <span className="ml-2 text-purple-400">×</span>
                </Badge>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex gap-3">
              <FileCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-900">Ready to Submit</p>
                <p className="text-xs text-emerald-700 mt-1">Codes match standard medical necessity rules.</p>
              </div>
            </div>

            <Button className="w-full rounded-xl"><Send className="h-4 w-4 mr-2" /> Submit to Billing / Insurance</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
