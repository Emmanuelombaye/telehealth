import { Activity, Search, Maximize2, ZoomIn, Eye, Download, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "../../../../components/ui/shared";
import { ImageWithFallback } from "../../../../components/figma/ImageWithFallback";

export function DoctorImagingPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" /> Medical Imaging (DICOM)
          </h1>
          <p className="text-sm text-muted-foreground">Secure, zero-footprint diagnostic viewer.</p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Study List */}
        <Card className="w-80 flex flex-col overflow-hidden shrink-0">
          <CardHeader className="pb-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search MRN or Name..." 
                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
            {[
              { patient: "Alice Thompson", date: "May 1, 2026", type: "Chest X-Ray", id: "IMG-942" },
              { patient: "Robert Wilson", date: "Apr 28, 2026", type: "Brain MRI", id: "IMG-941" },
              { patient: "Maria Garcia", date: "Apr 15, 2026", type: "CT Abdomen", id: "IMG-890" },
            ].map((study, i) => (
              <div key={i} className={`p-4 border-b border-border cursor-pointer transition-colors ${i === 0 ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/50 border-l-4 border-l-transparent"}`}>
                <p className="font-bold text-sm">{study.type}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{study.patient} • {study.date}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-2 bg-muted inline-block px-1.5 py-0.5 rounded">Acc: {study.id}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Main Viewer */}
        <Card className="flex-1 flex flex-col overflow-hidden bg-black text-white border-0 shadow-xl">
          <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 gap-2"><ZoomIn className="h-4 w-4" /> Zoom</Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 gap-2"><Eye className="h-4 w-4" /> Contrast</Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-8 gap-2"><Activity className="h-4 w-4" /> Measure</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8"><Download className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8"><Maximize2 className="h-4 w-4" /></Button>
            </div>
          </div>
          
          <div className="flex-1 relative bg-black flex items-center justify-center p-4">
            <div className="absolute top-4 left-4 text-xs text-white/70 font-mono space-y-1 z-10 drop-shadow-md">
              <p>Alice Thompson</p>
              <p>DOB: 1992-04-15 (34Y F)</p>
              <p>Study Date: 2026-05-01</p>
            </div>
            <div className="absolute top-4 right-4 text-xs text-white/70 font-mono space-y-1 text-right z-10 drop-shadow-md">
              <p>Institution: Brandon Health Center</p>
              <p>Modality: CR (Chest)</p>
              <p>W: 2048 L: 2048</p>
            </div>
            
            {/* Mock X-Ray Image using Unsplash */}
            <div className="w-full h-full max-w-2xl relative overflow-hidden rounded-md opacity-80 mix-blend-screen filter grayscale contrast-125">
               <ImageWithFallback 
                 src="https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=1000"
                 alt="Medical Scan"
                 className="w-full h-full object-contain"
               />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
