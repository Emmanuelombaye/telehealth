import { useState, useEffect } from "react";
import { Users, Plus, Shield, Edit2, Trash2, Heart, Loader2 } from "lucide-react";
import { Card, CardContent, Button, Badge } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

export function FamilyAccessPage() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMembers();
  }, [user]);

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error("Fetch members error:", err);
    } finally {
      setLoading(false);
    }
  }

  const deleteMember = async (id: string) => {
    try {
      await supabase.from('family_members').delete().eq('id', id);
      setMembers(members.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Family Access</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage who can access your health records</p>
        </div>
        <Button size="sm" className="rounded-full gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Member
        </Button>
      </div>

      <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-2xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
        <p className="text-xs text-violet-800 dark:text-violet-300">
          Family members can only access what you explicitly allow. All access is logged for HIPAA compliance.
        </p>
      </div>

      <div className="space-y-3">
        {members.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No family members added</p>
            </CardContent>
          </Card>
        ) : members.map(m => (
          <Card key={m.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                  {m.avatar || m.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground">{m.relation} · Age {m.age}</p>
                  <Badge variant={m.access_level === "Full" ? "success" : m.access_level === "View Only" ? "secondary" : "outline"} className="text-[10px] mt-1">
                    {m.access_level}
                  </Badge>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-xl"><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMember(m.id)} className="h-8 w-8 p-0 rounded-xl text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
