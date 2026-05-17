import { Wrench, Zap, Bot, Workflow, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared.tsx";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { toast } from "sonner";

type ToolItem = {
  id: number;
  name: string;
  desc: string;
  status: boolean;
  category: string;
};

const DEFAULT_TOOLS: ToolItem[] = [
  { id: 1, name: "AI Symptom Checker", desc: "AI-powered triage tool for patients before booking.", status: true, category: "AI" },
  { id: 2, name: "Automated Reminders", desc: "SMS/email reminders for appointments and refills.", status: true, category: "Automation" },
  { id: 3, name: "Workflow Builder", desc: "Visual drag-and-drop workflow automation.", status: false, category: "Automation" },
  { id: 4, name: "Chatbot Assistant", desc: "24/7 patient support chatbot.", status: true, category: "AI" },
  { id: 5, name: "E-Prescribing Integration", desc: "Direct integration with pharmacy networks.", status: true, category: "Integration" },
  { id: 6, name: "Insurance Verification API", desc: "Real-time insurance eligibility checks.", status: false, category: "Integration" },
];

export function AdminToolsPage() {
  const [tools, setTools] = useState<ToolItem[]>(DEFAULT_TOOLS);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Load tools from database
  const loadTools = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_tools")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        // Fall back silently to default tools if database table isn't created yet
        console.warn("[Platform Tools] DB read error (falling back to defaults):", error.message);
        setTools(DEFAULT_TOOLS);
      } else if (data && data.length > 0) {
        const mapped = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          desc: d.description || "",
          status: d.status,
          category: d.category || "General",
        }));
        setTools(mapped);
      }
    } catch (e) {
      console.error("[Platform Tools] Load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  // Toggle tool status in database
  const handleToggle = async (id: number, currentStatus: boolean, name: string) => {
    setUpdatingId(id);
    const newStatus = !currentStatus;
    
    try {
      // First optimistic update
      setTools(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

      const { error } = await supabase
        .from("platform_tools")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        // Revert local state on error
        setTools(prev => prev.map(t => t.id === id ? { ...t, status: currentStatus } : t));
        throw error;
      }

      toast.success(`${name} updated`, {
        description: `${name} is now ${newStatus ? 'activated' : 'deactivated'} in real-time.`,
      });
    } catch (err: any) {
      console.error("[Platform Tools] Toggle failed:", err);
      toast.error(`Could not toggle ${name}`, {
        description: err.message || "Database update failed. Make sure to run the platform_tools SQL migration.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tools & Services</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Control live microservices and integrations across the platform.</p>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", count: tools.filter(t => t.status).length, color: "text-emerald-600" },
          { label: "Inactive", count: tools.filter(t => !t.status).length, color: "text-muted-foreground" },
          { label: "Total", count: tools.length, color: "text-primary" }
        ].map((s, i) => (
          <Card key={i} className="border-none bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.count}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        {tools.map(tool => {
          const isUpdating = updatingId === tool.id;
          return (
            <Card key={tool.id} className="hover:border-primary/40 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {tool.category === "AI" ? (
                      <Bot className="h-5 w-5 text-primary" />
                    ) : tool.category === "Automation" ? (
                      <Workflow className="h-5 w-5 text-primary" />
                    ) : (
                      <Zap className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{tool.name}</p>
                      <Badge variant="outline" className="text-[10px]">{tool.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{tool.desc}</p>
                  </div>
                  <button 
                    disabled={isUpdating}
                    onClick={() => handleToggle(tool.id, tool.status, tool.name)} 
                    className="shrink-0 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    ) : tool.status ? (
                      <ToggleRight className="h-8 w-8 text-emerald-600 transition-colors" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-muted-foreground transition-colors" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
