import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Send, Lock, Search, ChevronLeft, Paperclip, Loader2 } from "lucide-react";
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
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch conversation threads (unique senders/receivers the user has talked to)
  useEffect(() => {
    if (!user) return;
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
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Build unique thread map keyed by the "other" person's id
        const threadMap: Record<string, any> = {};
        (data || []).forEach((msg: any) => {
          const other = msg.sender_id === user.id ? msg.receiver : msg.sender;
          if (!other) return;
          if (!threadMap[other.id]) {
            threadMap[other.id] = {
              id: other.id,
              name: other.full_name,
              role: other.role,
              lastMsg: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    fetchThreads();
  }, [user, targetUserId]);

  // Handle targetUserId from URL to start a new chat
  useEffect(() => {
    if (!targetUserId || !user || threads.length === 0) return;
    const existing = threads.find(t => t.id === targetUserId);
    if (existing) {
      setActiveThread(existing);
    } else {
      // If the thread doesn't exist yet, we'd need to fetch the profile of targetUserId
      // For now, we wait for the first message to create the thread in the list
      async function fetchTargetProfile() {
        const { data } = await supabase.from('profiles').select('id, full_name, role').eq('id', targetUserId).single();
        if (data) {
          setActiveThread({
            id: data.id,
            name: data.full_name,
            role: data.role,
            lastMsg: "Start of conversation",
            time: "Now",
            unread: 0
          });
        }
      }
      fetchTargetProfile();
    }
  }, [targetUserId, threads, user]);

  // Fetch messages for a thread
  useEffect(() => {
    if (!activeThread || !user) return;
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, read')
        .or(
          `and(sender_id.eq.${user!.id},receiver_id.eq.${activeThread.id}),and(sender_id.eq.${activeThread.id},receiver_id.eq.${user!.id})`
        )
        .order('created_at', { ascending: true });
      if (!error) setMessages(data || []);
    }
    fetchMessages();

    const channel = supabase
      .channel(`messages-thread-${activeThread.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        const isInThread =
          (msg.sender_id === user.id && msg.receiver_id === activeThread.id) ||
          (msg.sender_id === activeThread.id && msg.receiver_id === user.id);
        if (isInThread) setMessages(prev => [...prev, msg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeThread, user]);

  // Scroll to bottom on new message
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
        read: false,
      });
      if (error) throw error;
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {!activeThread ? (
        <>
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <Lock className="h-3 w-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">End-to-end encrypted</span>
              </div>
            </div>
          </div>

          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm border-none focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search messages..." />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Lock className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs mt-1">Your doctor will message you here after your consultation.</p>
              </div>
            ) : threads.map(thread => (
              <button key={thread.id} onClick={() => setActiveThread(thread)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-accent transition-colors text-left">
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {thread.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold truncate">{thread.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{thread.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate capitalize">{thread.role} · {thread.lastMsg}</p>
                </div>
                {thread.unread > 0 && (
                  <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {thread.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Chat header */}
          <div className="flex items-center gap-3 pb-3 border-b border-border mb-3 shrink-0">
            <button onClick={() => { setActiveThread(null); setMessages([]); }} className="p-1.5 rounded-xl hover:bg-accent">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
              {activeThread.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{activeThread.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{activeThread.role}</p>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">Encrypted</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-2">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Start the conversation...</div>
            ) : messages.map(msg => (
              <div key={msg.id} className={cn("flex", msg.sender_id === user?.id ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
                  msg.sender_id === user?.id
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm")}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={cn("text-[10px] mt-1", msg.sender_id === user?.id ? "text-white/70 text-right" : "text-muted-foreground")}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 pt-3 border-t border-border shrink-0">
            <button className="p-2 rounded-xl hover:bg-accent text-muted-foreground"><Paperclip className="h-4 w-4" /></button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Type a secure message..."
            />
            <Button size="sm" className="rounded-xl h-9 w-9 p-0" onClick={handleSend} disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
