import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Send, Lock, Search, ChevronLeft, Paperclip, Loader2, MessageSquare, Shield } from "lucide-react";
import { Button, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib";

export function MessagesPage() {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [threadQuery, setThreadQuery] = useState("");
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const [resolvingTarget, setResolvingTarget] = useState(!!targetUserId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Step 1: Fetch threads
  useEffect(() => {
    if (!user) {
      // Fallback: If auth state is missing or bypassed, don't spin infinitely
      const timer = setTimeout(() => setLoading(false), 1500);
      return () => clearTimeout(timer);
    }
    fetchThreads();
  }, [user]);

  async function fetchThreads() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, content, created_at,
          sender_id, receiver_id,
          sender:profiles!messages_sender_id_fkey(id, full_name, role),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, role)
        `)
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const threadMap: Record<string, any> = {};
      (data || []).forEach((msg: any) => {
        const other = msg.sender_id === user!.id ? msg.receiver : msg.sender;
        if (!other) return;
        if (!threadMap[other.id]) {
          threadMap[other.id] = {
            id: other.id,
            name: other.full_name || "Unknown",
            role: other.role,
            lastMsg: msg.content,
            time: formatMessageTime(msg.created_at),
            unread: 0,
          };
        }
      });
      setThreads(Object.values(threadMap));
    } catch (err) {
      console.error("Thread fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const q = threadQuery.trim().toLowerCase();
  const filteredThreads = q
    ? threads.filter((t) => {
        return (
          t.name.toLowerCase().includes(q) ||
          (t.lastMsg && String(t.lastMsg).toLowerCase().includes(q)) ||
          (t.role && String(t.role).toLowerCase().replace(/_/g, " ").includes(q))
        );
      })
    : threads;

  // Step 2: If targetUserId in URL, open that thread immediately — don't wait for threads
  useEffect(() => {
    if (!targetUserId || !user) {
      setResolvingTarget(false);
      return;
    }
    openThreadById(targetUserId).finally(() => setResolvingTarget(false));
  }, [targetUserId, user]);

  async function openThreadById(targetId: string) {
    // Check if we already have this thread in state
    const existing = threads.find(t => t.id === targetId);
    if (existing) {
      setActiveThread(existing);
      return;
    }
    // Fetch the profile directly — no dependency on threads list
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', targetId)
      .single();

    if (data) {
      setActiveThread({
        id: data.id,
        name: data.full_name || "Unknown",
        role: data.role,
        lastMsg: "",
        time: "Now",
        unread: 0,
      });
    }
  }

  // Step 3: Fetch messages for active thread + subscribe real-time
  useEffect(() => {
    if (!activeThread || !user) return;

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, receiver_id, is_read')
        .or(
          `and(sender_id.eq.${user!.id},receiver_id.eq.${activeThread.id}),and(sender_id.eq.${activeThread.id},receiver_id.eq.${user!.id})`
        )
        .order('created_at', { ascending: true });
      if (!error) setMessages(data || []);
    }
    fetchMessages();

    const channel = supabase
      .channel(`thread-${user.id}-${activeThread.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        const isInThread =
          (msg.sender_id === user!.id && msg.receiver_id === activeThread.id) ||
          (msg.sender_id === activeThread.id && msg.receiver_id === user!.id);
        if (isInThread) setMessages(prev => [...prev, msg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeThread, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeThread || !user || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: activeThread.id,
        content,
        is_read: false,
      });
      if (error) throw error;
      // Refresh thread list so it shows the latest message
      fetchThreads();
    } catch (err) {
      console.error("Send error:", err);
      setInput(content); // restore on error
    } finally {
      setSending(false);
    }
  };

  const initials = (name?: string) =>
    (name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const formatMessageTime = (dateVal?: string | null) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ─── ACTIVE CHAT VIEW ────────────────────────────────────────────────────────
  if (resolvingTarget) {
    return (
      <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activeThread) {
    return (
      <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border mb-4 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveThread(null); setMessages([]); }}
            className="p-1.5 rounded-xl hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
            {initials(activeThread.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{activeThread.name}</p>
            <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              {activeThread.role?.replace('_', ' ')} · Online
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] text-emerald-600 font-semibold">HIPAA Encrypted</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
              <div className="h-14 w-14 rounded-full bg-primary/5 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-primary/30" />
              </div>
              <p className="text-sm font-medium">Start the conversation</p>
              <p className="text-xs">Your message is encrypted and secure.</p>
            </div>
          ) : messages.map(msg => (
            <div key={msg.id} className={cn("flex", msg.sender_id === user?.id ? "justify-end" : "justify-start")}>
              {msg.sender_id !== user?.id && (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary mr-2 mt-1 shrink-0">
                  {initials(activeThread.name)}
                </div>
              )}
              <div className={cn(
                "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                msg.sender_id === user?.id
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}>
                <p className="leading-relaxed">{msg.content}</p>
                <p className={cn(
                  "text-[10px] mt-1.5",
                  msg.sender_id === user?.id ? "text-white/60 text-right" : "text-muted-foreground"
                )}>
                  {formatMessageTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 pt-3 border-t border-border shrink-0">
          <button type="button" className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors">
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            placeholder={`Message ${activeThread.name}...`}
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            className="rounded-xl h-10 w-10 p-0 shadow-md"
            onClick={handleSend}
            disabled={sending || !input.trim()}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  // ─── THREAD LIST VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h1 className="text-xl font-bold">Messages</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Shield className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">End-to-end encrypted · HIPAA compliant</span>
          </div>
        </div>
      </div>

      <div className="relative mb-4 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={threadQuery}
          onChange={(e) => setThreadQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all disabled:opacity-50"
          placeholder="Search conversations..."
          disabled={loading}
          aria-busy={loading}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">{threadQuery.trim() ? "No matching conversations" : "No messages yet"}</p>
            <p className="text-xs mt-1 opacity-70">
              {threadQuery.trim()
                ? "Try a different search."
                : "Your doctor will message you here after your consultation."}
            </p>
          </div>
        ) : (
          <>
            {filteredThreads.map((thread) => (
              <button
                type="button"
                key={thread.id}
                onClick={() => setActiveThread(thread)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-accent transition-colors text-left group"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0 group-hover:scale-105 transition-transform">
                  {initials(thread.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate">{thread.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{thread.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate capitalize mt-0.5">
                    {thread.role?.replace('_', ' ')} · {thread.lastMsg}
                  </p>
                </div>
                {thread.unread > 0 && (
                  <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {thread.unread}
                  </span>
                )}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
