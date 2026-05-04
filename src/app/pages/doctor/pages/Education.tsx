import { BookOpen, Search, Send, Video, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../components/ui/shared";

export function DoctorEducationPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Patient Education Library
          </h1>
          <p className="text-sm text-muted-foreground">Send verified medical articles and care plans to patients.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search conditions, diets, recovery plans..." 
                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
              <Badge variant="secondary" className="cursor-pointer bg-primary text-white">All</Badge>
              <Badge variant="secondary" className="cursor-pointer">Cardiology</Badge>
              <Badge variant="secondary" className="cursor-pointer">Diet & Nutrition</Badge>
              <Badge variant="secondary" className="cursor-pointer">Physical Therapy</Badge>
              <Badge variant="secondary" className="cursor-pointer">Mental Health</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {[
              { title: "Managing Hypertension with Diet (DASH Diet)", type: "Article", icon: FileText, category: "Cardiology" },
              { title: "Lower Back Pain Stretching Routine", type: "Video", icon: Video, category: "Physical Therapy" },
              { title: "Understanding Type 2 Diabetes", type: "Article", icon: FileText, category: "Endocrinology" },
              { title: "Post-Concussion Rest Guidelines", type: "Care Plan", icon: FileText, category: "Neurology" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{item.type}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8">Preview</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Send to Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Select Patient</label>
              <select className="w-full mt-2 border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary">
                <option>Alice Thompson (Recent)</option>
                <option>Robert Wilson (Recent)</option>
                <option>Search other patients...</option>
              </select>
            </div>

            <div className="p-3 border border-border rounded-xl bg-muted/30">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Selected Content</p>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold truncate">Managing Hypertension with Diet</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-900">Patient Portal Ready</p>
                <p className="text-xs text-emerald-700 mt-1">Content will appear in their 'Documents & Education' tab instantly.</p>
              </div>
            </div>

            <Button className="w-full rounded-xl"><Send className="h-4 w-4 mr-2" /> Send Educational Material</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
