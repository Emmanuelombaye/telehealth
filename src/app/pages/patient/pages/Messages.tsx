import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Send, Lock, Loader2, MessageSquare, Stethoscope, Check, CheckCheck } from "lucide-react";
import { Button, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore, usePatientStore } from "../../../../lib";
import { getAssignedDoctor, type AssignedDoctor } from "../../../../lib/patientMessaging";

type ChatMessage = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
};

function ReadReceipt({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) {
  if (!isMine) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 ml-1 align-middle",
        msg.is_read ? "text-white/90" : "text-white/50",
      )}
      title={msg.is_read ? "Read by your doctor" : "Sent"}
      aria-label={msg.is_read ? "Read" : "Delivered"}
    >
      {msg.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
    </span>
  );
}

export function MessagesPage() {
  const [searchParams] = useSearchParams();
  const deepLinkDoctorId = searchParams.get("userId");
  const { user } = useAuthStore();
  const orders = usePatientStore((s) => s.orders);
  const unreadMessagesCount = usePatientStore((s) => s.unreadMessagesCount);
  const [doctor, setDoctor] = useState<AssignedDoctor | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function init() {
      setLoading(true);
      let d: AssignedDoctor | null = null;

      if (deepLinkDoctorId) {
        const fromOrder = orders.find((o) => o.doctor_id === deepLinkDoctorId);
        d = {
          id: deepLinkDoctorId,
          name: fromOrder?.doctor || "Your doctor",
        };
      } else {
        const latest = orders.find((o) => o.doctor_id);
        if (latest?.doctor_id) {
          d = { id: latest.doctor_id, name: latest.doctor || "Your doctor" };
        } else {
          d = await getAssignedDoctor(user!.id);
        }
      }
      setDoctor(d);

      if (d) {
        const { data } = await supabase
          .from("messages")
          .select("id, content, created_at, sender_id, receiver_id, is_read")
          .or(
            `and(sender_id.eq.${user!.id},receiver_id.eq.${d.id}),and(sender_id.eq.${d.id},receiver_id.eq.${user!.id})`,
          )
          .order("created_at", { ascending: true });

        setMessages((data as ChatMessage[]) || []);

        const unread = (data || []).filter((m) => m.receiver_id === user!.id && !m.is_read).map((m) => m.id);
        if (unread.length) {
          await supabase.from("messages").update({ is_read: true }).in("id", unread);
          usePatientStore.getState().fetchUnreadMessages();
        }
      } else {
        setMessages([]);
      }
      setLoading(false);
    }

    void init();
  }, [user?.id, orders, deepLinkDoctorId]);

  useEffect(() => {
    if (!user?.id || !doctor?.id) return;

    const channel = supabase
      .channel(`patient-doctor-${user.id}-${doctor.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as ChatMessage;
        const inThread =
          (msg.sender_id === user.id && msg.receiver_id === doctor.id) ||
          (msg.sender_id === doctor.id && msg.receiver_id === user.id);
        if (!inThread) return;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        if (msg.receiver_id === user.id) {
          supabase.from("messages").update({ is_read: true }).eq("id", msg.id).then(() => {
            setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
            usePatientStore.getState().fetchUnreadMessages();
          });
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updated = payload.new as ChatMessage;
        const inThread =
          (updated.sender_id === user.id && updated.receiver_id === doctor.id) ||
          (updated.sender_id === doctor.id && updated.receiver_id === user.id);
        if (!inThread) return;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, is_read: updated.is_read } : m)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, doctor?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user?.id || !doctor?.id || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: doctor.id,
        content,
        is_read: false,
      });
      if (error) throw error;
    } catch (err) {
      console.error("Send error:", err);
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-muted-foreground">
        <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">No doctor assigned yet</p>
        <p className="text-sm mt-2">After your order is assigned to a physician, you can message them here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4 shrink-0">
        <div className="h-11 w-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{doctor.name}</p>
          <p className="text-xs text-muted-foreground">
            Your doctor
            {unreadMessagesCount > 0 ? ` · ${unreadMessagesCount} unread elsewhere` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-emerald-600">
          <Lock className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold">Encrypted</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2 py-12">
            <MessageSquare className="h-10 w-10 opacity-20" />
            <p className="text-sm">Send a message to {doctor.name}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
                    isMine ? "bg-primary text-white rounded-br-sm" : "bg-muted rounded-bl-sm",
                  )}
                >
                  <p>{msg.content}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1 flex items-center justify-end gap-0.5",
                      isMine ? "text-white/70" : "text-muted-foreground",
                    )}
                  >
                    {formatTime(msg.created_at)}
                    <ReadReceipt msg={msg} isMine={isMine} />
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 pt-3 border-t border-border shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder={`Message ${doctor.name}...`}
        />
        <Button
          type="button"
          size="sm"
          className="rounded-xl h-10 w-10 p-0"
          onClick={handleSend}
          disabled={sending || !input.trim()}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
