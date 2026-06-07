import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Send,
  Lock,
  Search,
  ChevronLeft,
  Loader2,
  MessageSquare,
  Shield,
  RefreshCw,
  UserPlus,
  Inbox,
  Users,
  Filter,
  Stethoscope,
  ExternalLink,
} from "lucide-react";
import { Button, Badge, Input, cn } from "../../../components/ui/shared.tsx";
import { DoctorPageHeader } from "../../../components/doctor/DoctorPageHeader";
import { doctorPageContainer, doctorSurfaceCard, doctorInsetCard } from "../../../../lib/doctorPortalUi";
import { doctorMessagesHref, useDoctorPortalBase } from "../../../../lib/doctorPortalBase";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore, usePatientStore } from "../../../../lib";
import { fetchMessagesWithProfiles } from "../../../../lib/messagesFetch";
import { profileDisplayName } from "../../../../lib/profileLookup";
import {
  buildPatientContacts,
  buildThreadsFromMessages,
  formatMessageTime,
  initials,
  QUICK_REPLIES,
  ROLE_BADGE,
  type ChatMessage,
  type MessageThread,
  type PatientContact,
  type RawMessageRow,
} from "../../../../lib/doctorMessages";
import { toast } from "sonner";
import { useScrollToBottomOnNewMessages } from "../../../../lib/messageScroll";

type ThreadFilter = "all" | "patients" | "unread";

export function DoctorMessagesPage() {
  const doctorBase = useDoctorPortalBase();
  const { user } = useAuthStore();
  const { fetchUnreadMessages } = usePatientStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [patientContacts, setPatientContacts] = useState<PatientContact[]>([]);
  const [userIdToOrderId, setUserIdToOrderId] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [threadQuery, setThreadQuery] = useState("");
  const [filter, setFilter] = useState<ThreadFilter>("all");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [resolvingTarget, setResolvingTarget] = useState(!!targetUserId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeThreadIdRef = useRef<string | null>(null);
  const threadsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeThreadIdRef.current = activeThread?.id ?? null;
  }, [activeThread?.id]);

  const fetchThreads = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user) return;
    if (!opts?.silent) setRefreshing(true);
    try {
      const [msgRes, ordersRes] = await Promise.all([
        fetchMessagesWithProfiles({
          orFilter: `sender_id.eq.${user.id},receiver_id.eq.${user.id}`,
          limit: 400,
          ascending: false,
        }),
        supabase
          .from("orders")
          .select("id, user_id, patient_name, order_number, status")
          .eq("doctor_id", user.id)
          .not("user_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

      if (msgRes.error) throw msgRes.error;
      setThreads(buildThreadsFromMessages((msgRes.data || []) as unknown as RawMessageRow[], user.id));
      const contacts = buildPatientContacts(ordersRes.data || []);
      setPatientContacts(contacts);
      const orderMap: Record<string, string> = {};
      for (const c of contacts) {
        if (c.primaryOrderId) orderMap[c.userId] = c.primaryOrderId;
      }
      setUserIdToOrderId(orderMap);
    } catch (err) {
      console.error("Thread fetch error:", err);
      toast.error("Could not load conversations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => setLoading(false), 1500);
      return () => clearTimeout(t);
    }
    fetchThreads();
  }, [user, fetchThreads]);

  const openThreadById = useCallback(
    async (targetId: string) => {
      const existing = threads.find((t) => t.id === targetId);
      if (existing) {
        setActiveThread(existing);
        return;
      }
      const { data } = await supabase.from("profiles").select("id, full_name, email, role").eq("id", targetId).single();
      if (data) {
        setActiveThread({
          id: data.id,
          name: profileDisplayName(data, targetId),
          role: data.role || "patient",
          lastMsg: "",
          lastAt: new Date().toISOString(),
          timeLabel: "Now",
          unread: 0,
        });
      }
    },
    [threads],
  );

  useEffect(() => {
    if (!targetUserId || !user) {
      setResolvingTarget(false);
      return;
    }
    openThreadById(targetUserId).finally(() => setResolvingTarget(false));
  }, [targetUserId, user, openThreadById]);

  const fetchThreadMessages = useCallback(
    async (otherId: string) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("messages")
        .select("id, content, created_at, sender_id, receiver_id, is_read")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }
      setMessages((data || []) as ChatMessage[]);

      const unreadIds = (data || [])
        .filter((m: ChatMessage) => m.receiver_id === user.id && !m.is_read)
        .map((m: ChatMessage) => m.id);

      if (unreadIds.length > 0) {
        await supabase.from("messages").update({ is_read: true }).in("id", unreadIds);
        fetchUnreadMessages();
        fetchThreads({ silent: true });
      }
    },
    [user, fetchUnreadMessages, fetchThreads],
  );

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`doctor-messages-inbox-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        if (threadsDebounceRef.current) clearTimeout(threadsDebounceRef.current);
        threadsDebounceRef.current = setTimeout(() => {
          fetchThreads({ silent: true });
        }, 800);
      })
      .subscribe();
    return () => {
      if (threadsDebounceRef.current) clearTimeout(threadsDebounceRef.current);
      supabase.removeChannel(ch);
    };
  }, [user, fetchThreads, fetchThreadMessages]);

  useEffect(() => {
    if (!activeThread || !user) return;
    fetchThreadMessages(activeThread.id);

    const channel = supabase
      .channel(`doctor-thread-${user.id}-${activeThread.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as ChatMessage;
        const inThread =
          (msg.sender_id === user.id && msg.receiver_id === activeThread.id) ||
          (msg.sender_id === activeThread.id && msg.receiver_id === user.id);
        if (inThread) {
          setMessages((prev) => [...prev, msg]);
          if (msg.receiver_id === user.id && !msg.is_read) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", msg.id)
              .then(() => fetchUnreadMessages());
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThread, user, fetchThreadMessages, fetchUnreadMessages]);

  useScrollToBottomOnNewMessages(messages.length, bottomRef);

  const stats = useMemo(() => {
    const unread = threads.reduce((s, t) => s + t.unread, 0);
    const patients = threads.filter((t) => t.role === "patient").length;
    return { threads: threads.length, unread, patients, roster: patientContacts.length };
  }, [threads, patientContacts]);

  const filteredThreads = useMemo(() => {
    const q = threadQuery.trim().toLowerCase();
    return threads.filter((t) => {
      if (filter === "patients" && t.role !== "patient") return false;
      if (filter === "unread" && t.unread === 0) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.lastMsg.toLowerCase().includes(q) ||
        t.role.replace(/_/g, " ").toLowerCase().includes(q)
      );
    });
  }, [threads, threadQuery, filter]);

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return patientContacts.slice(0, 40);
    return patientContacts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.orderNumber && c.orderNumber.toLowerCase().includes(q)),
      )
      .slice(0, 40);
  }, [patientContacts, contactSearch]);

  const handleSend = async () => {
    if (!input.trim() || !activeThread || !user || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: activeThread.id,
        content,
        is_read: false,
      });
      if (error) throw error;
      await fetchThreads({ silent: true });
    } catch (err) {
      console.error("Send error:", err);
      setInput(content);
      toast.error("Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const selectThread = (thread: MessageThread) => {
    setActiveThread(thread);
    setShowNewMessage(false);
    setSearchParams({ userId: thread.id });
  };

  const closeThread = () => {
    setActiveThread(null);
    setMessages([]);
    setSearchParams({});
  };

  const startWithContact = (c: PatientContact) => {
    selectThread({
      id: c.userId,
      name: c.name,
      role: "patient",
      lastMsg: "",
      lastAt: new Date().toISOString(),
      timeLabel: "Now",
      unread: 0,
    });
    setShowNewMessage(false);
  };

  if (resolvingTarget && !activeThread) {
    return (
      <div className={doctorPageContainer}>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 mt-3">Opening conversation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(doctorPageContainer, "space-y-5 pb-12 animate-in fade-in duration-500")}>
      <DoctorPageHeader
        variant="hero"
        eyebrow="HIPAA secure channel"
        title="Secure Messaging"
        description={`Encrypted physician–patient inbox at ${doctorMessagesHref(doctorBase)} — threads sync in real time; open patients via ?userId= from consult or queue.`}
      >
        <Button
          variant="outline"
          className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20"
          onClick={() => void fetchThreads()}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Sync
        </Button>
        <Button
          className="rounded-xl bg-[#D4AF37]/90 text-[#0A2E1F] hover:bg-[#D4AF37] font-bold"
          onClick={() => setShowNewMessage((v) => !v)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Message patient
        </Button>
      </DoctorPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Conversations", value: stats.threads, icon: Inbox },
          { label: "Unread", value: stats.unread, icon: MessageSquare },
          { label: "Patient threads", value: stats.patients, icon: Users },
          { label: "Roster contacts", value: stats.roster, icon: Stethoscope },
        ].map((s) => (
          <div key={s.label} className={doctorSurfaceCard}>
            <div className="flex items-center gap-4 p-5">
              <s.icon className="h-6 w-6 text-emerald-700 shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">{s.label}</p>
                <p className="text-2xl font-black text-[#0A2E1F]">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNewMessage && (
        <div className={cn(doctorSurfaceCard, "p-5 space-y-3")}>
          <p className="text-[10px] font-black uppercase text-slate-500">Start from clinical roster</p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search patient name or order #…"
              className="pl-9 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <p className="text-sm text-slate-500">No patients in roster yet — cases appear from orders.</p>
            ) : (
              filteredContacts.map((c) => (
                <button
                  key={c.userId}
                  type="button"
                  onClick={() => startWithContact(c)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:border-emerald-300 text-xs font-bold text-[#0A2E1F]"
                >
                  {c.name}
                  {c.orderNumber && (
                    <span className="block text-[10px] font-normal text-slate-500">{c.orderNumber}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(280px,360px)_1fr] gap-4 min-h-[calc(100vh-18rem)]">
        {/* Thread list */}
        <div className={cn(doctorSurfaceCard, "flex flex-col overflow-hidden", activeThread && "hidden lg:flex")}>
          <div className="p-4 border-b border-emerald-100/80 space-y-3 shrink-0">
            <div className="flex items-center gap-2 text-emerald-800">
              <Shield className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">End-to-end encrypted</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={threadQuery}
                onChange={(e) => setThreadQuery(e.target.value)}
                placeholder="Search conversations…"
                className="pl-9 rounded-xl"
                disabled={loading}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "patients", label: "Patients" },
                  { id: "unread", label: "Unread" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase border inline-flex items-center gap-1",
                    filter === f.id
                      ? "bg-[#0A2E1F] text-white border-[#0A2E1F]"
                      : "bg-white text-slate-600 border-slate-200",
                  )}
                >
                  <Filter className="h-3 w-3 opacity-50" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageSquare className="h-10 w-10 text-emerald-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#0A2E1F]">
                  {threadQuery.trim() || filter !== "all" ? "No matching threads" : "No messages yet"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Open a case from the queue or message a patient from your roster.
                </p>
                <Link
                  to={`${doctorBase}/queue`}
                  className="inline-flex mt-3 text-xs font-bold text-emerald-700 hover:underline"
                >
                  Clinical queue
                </Link>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => selectThread(thread)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors mb-1",
                    activeThread?.id === thread.id
                      ? "bg-emerald-50 border border-emerald-200"
                      : "hover:bg-slate-50 border border-transparent",
                  )}
                >
                  <div className="h-11 w-11 rounded-2xl bg-emerald-100 flex items-center justify-center font-black text-emerald-800 text-sm shrink-0">
                    {initials(thread.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-[#0A2E1F] truncate">{thread.name}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{thread.timeLabel}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{thread.lastMsg || "No messages yet"}</p>
                  </div>
                  {thread.unread > 0 && (
                    <span className="h-5 min-w-[20px] px-1 rounded-full bg-[#0A2E1F] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                      {thread.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div
          className={cn(
            doctorSurfaceCard,
            "flex flex-col overflow-hidden min-h-[420px]",
            !activeThread && "hidden lg:flex",
          )}
        >
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-16 w-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="font-black text-[#0A2E1F]">Select a conversation</p>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                Choose a thread from the list or start a new secure message with a patient from your roster.
              </p>
              <Button className="mt-4 rounded-xl" onClick={() => setShowNewMessage(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Message patient
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-emerald-100/80 shrink-0">
                <button
                  type="button"
                  onClick={closeThread}
                  className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
                  aria-label="Back to threads"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="h-11 w-11 rounded-2xl bg-emerald-100 flex items-center justify-center font-black text-emerald-800 text-sm shrink-0">
                  {initials(activeThread.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#0A2E1F] truncate">{activeThread.name}</p>
                  <Badge
                    className={cn(
                      "text-[9px] font-black uppercase border mt-0.5",
                      ROLE_BADGE[activeThread.role] || ROLE_BADGE.patient,
                    )}
                  >
                    {activeThread.role?.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-emerald-700">
                  <Lock className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold hidden sm:inline">Encrypted</span>
                </div>
                {activeThread.role === "patient" && userIdToOrderId[activeThread.id] && (
                  <Link
                    to={`${doctorBase}/patients/${userIdToOrderId[activeThread.id]}`}
                    className="p-2 rounded-xl hover:bg-emerald-50 text-emerald-800"
                    title="Patient chart"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-2 py-12">
                    <MessageSquare className="h-10 w-10 text-emerald-200" />
                    <p className="text-sm font-bold text-[#0A2E1F]">Start the conversation</p>
                    <p className="text-xs">Messages are stored securely and visible only to participants.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex", msg.sender_id === user?.id ? "justify-end" : "justify-start")}
                    >
                      {msg.sender_id !== user?.id && (
                        <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-800 mr-2 mt-1 shrink-0">
                          {initials(activeThread.name)}
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                          msg.sender_id === user?.id
                            ? "bg-[#0A2E1F] text-white rounded-br-md"
                            : "bg-slate-100 text-slate-800 rounded-bl-md border border-slate-200/80",
                        )}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1.5",
                            msg.sender_id === user?.id ? "text-white/60 text-right" : "text-slate-400",
                          )}
                        >
                          {formatMessageTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className={cn(doctorInsetCard, "mx-4 mb-3 p-2 flex flex-wrap gap-1.5")}>
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setInput(q)}
                    className="text-[10px] font-medium text-slate-600 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 text-left max-w-full truncate"
                    title={q}
                  >
                    {q.slice(0, 48)}…
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 p-4 border-t border-emerald-100/80 shrink-0">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 rounded-2xl"
                  placeholder={`Message ${activeThread.name}…`}
                />
                <Button
                  type="button"
                  className="rounded-xl h-10 w-10 p-0 bg-[#0A2E1F] hover:bg-emerald-900"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
