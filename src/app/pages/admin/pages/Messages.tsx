import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  ChevronLeft,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Stethoscope,
  User,
} from "lucide-react";
import { Badge, Button, Input, cn } from "../../../components/ui/shared.tsx";
import { supabase } from "../../../../lib/supabaseClient";
import { useAuthStore } from "../../../../lib/auth-store";
import { applyOrdersBrandScope, resolveAdminBrandScope } from "../../../../lib/adminScope";
import { fetchMessagesWithProfiles } from "../../../../lib/messagesFetch";
import { useScrollToBottomOnNewMessages } from "../../../../lib/messageScroll";
import { useBrand } from "../../../context/BrandContext";
import {
  buildPlatformThreadsFromMessages,
  formatMessageTime,
  initials,
  ROLE_BADGE,
  type ChatMessage,
  type PlatformMessageThread,
  type RawMessageRow,
} from "../../../../lib/doctorMessages";
import { toast } from "sonner";

type ThreadFilter = "all" | "unread";

function parseThreadKey(key: string): { patientId: string; doctorId: string } | null {
  const [patientId, doctorId] = key.split("::");
  if (!patientId || !doctorId) return null;
  return { patientId, doctorId };
}

export function AdminMessagesPage() {
  const { role, brandId: authBrandId } = useAuthStore();
  const { brand: tenantBrand } = useBrand();
  const brandId = resolveAdminBrandScope(role, authBrandId, tenantBrand.id);

  const [searchParams, setSearchParams] = useSearchParams();
  const threadKey = searchParams.get("thread");

  const [threads, setThreads] = useState<PlatformMessageThread[]>([]);
  const [activeThread, setActiveThread] = useState<PlatformMessageThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [threadQuery, setThreadQuery] = useState("");
  const [filter, setFilter] = useState<ThreadFilter>("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  useScrollToBottomOnNewMessages(messages.length, bottomRef);

  const fetchBrandParticipantIds = useCallback(async () => {
    let q = supabase
      .from("orders")
      .select("user_id, doctor_id")
      .not("user_id", "is", null)
      .limit(500);
    q = applyOrdersBrandScope(q, role, brandId);
    const { data, error } = await q;
    if (error) throw error;
    const ids = new Set<string>();
    for (const row of data ?? []) {
      if (row.user_id) ids.add(row.user_id);
      if (row.doctor_id) ids.add(row.doctor_id);
    }
    return [...ids];
  }, [role, brandId]);

  const fetchThreads = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setRefreshing(true);
      try {
        const participantIds = await fetchBrandParticipantIds();
        if (!participantIds.length) {
          setThreads([]);
          return;
        }

        const inList = participantIds.join(",");
        const { data, error } = await fetchMessagesWithProfiles({
          orFilter: `sender_id.in.(${inList}),receiver_id.in.(${inList})`,
          limit: 400,
          ascending: false,
        });

        if (error) throw error;
        setThreads(buildPlatformThreadsFromMessages((data || []) as unknown as RawMessageRow[]));
      } catch (err) {
        console.error("Brand messages fetch error:", err);
        toast.error("Could not load brand messages.");
        setThreads([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchBrandParticipantIds],
  );

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (!threadKey) {
      setActiveThread(null);
      setMessages([]);
      return;
    }
    const existing = threads.find((t) => t.id === threadKey);
    if (existing) setActiveThread(existing);
  }, [threadKey, threads]);

  const fetchThreadMessages = useCallback(async (thread: PlatformMessageThread) => {
    const parsed = parseThreadKey(thread.id);
    if (!parsed) return;

    const { patientId, doctorId } = parsed;
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, created_at, sender_id, receiver_id, is_read")
      .or(
        `and(sender_id.eq.${patientId},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${patientId})`,
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Could not load conversation.");
      return;
    }
    setMessages((data || []) as ChatMessage[]);
  }, []);

  useEffect(() => {
    if (!activeThread) return;
    void fetchThreadMessages(activeThread);
  }, [activeThread, fetchThreadMessages]);

  const stats = useMemo(() => {
    const unread = threads.reduce((s, t) => s + t.unread, 0);
    return { threads: threads.length, unread };
  }, [threads]);

  const filteredThreads = useMemo(() => {
    const q = threadQuery.trim().toLowerCase();
    return threads.filter((t) => {
      if (filter === "unread" && t.unread === 0) return false;
      if (!q) return true;
      return (
        t.patientName.toLowerCase().includes(q) ||
        t.doctorName.toLowerCase().includes(q) ||
        t.lastMsg.toLowerCase().includes(q)
      );
    });
  }, [threads, threadQuery, filter]);

  const selectThread = (thread: PlatformMessageThread) => {
    setActiveThread(thread);
    setSearchParams({ thread: thread.id });
  };

  const closeThread = () => {
    setActiveThread(null);
    setMessages([]);
    setSearchParams({});
  };

  const senderLabel = (senderId: string) => {
    if (!activeThread) return "?";
    if (senderId === activeThread.patientId) return activeThread.patientName;
    if (senderId === activeThread.doctorId) return activeThread.doctorName;
    return "Staff";
  };

  const senderRole = (senderId: string) => {
    if (!activeThread) return "staff";
    if (senderId === activeThread.patientId) return "patient";
    if (senderId === activeThread.doctorId) return "doctor";
    return "staff";
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Brand operations</p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Messaging & support</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Read-only view of patient–physician conversations for your brand. Encrypted in transit and at rest.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-lg h-10"
          onClick={() => void fetchThreads()}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Sync
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4 shadow-sm">
          <MessageSquare className="h-6 w-6 text-emerald-700 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500">Conversations</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.threads}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center gap-4 shadow-sm">
          <Shield className="h-6 w-6 text-emerald-700 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold uppercase text-slate-500">Unread (doctor side)</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.unread}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm grid lg:grid-cols-[minmax(280px,360px)_1fr] min-h-[calc(100vh-18rem)] overflow-hidden">
        <div className={cn("flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200", activeThread && "hidden lg:flex")}>
          <div className="p-4 space-y-3 shrink-0 border-b border-slate-100">
            <div className="flex items-center gap-2 text-emerald-800">
              <Lock className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">HIPAA secure channel</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={threadQuery}
                onChange={(e) => setThreadQuery(e.target.value)}
                placeholder="Search patient, doctor, or message…"
                className="pl-9 rounded-xl"
                disabled={loading}
              />
            </div>
            <div className="flex gap-1.5">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase border",
                    filter === f
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200",
                  )}
                >
                  {f}
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
                <MessageSquare className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-800">No conversations yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Threads appear when patients message their assigned physicians.
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => selectThread(thread)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors mb-1",
                    activeThread?.id === thread.id
                      ? "bg-emerald-50 border border-emerald-200"
                      : "hover:bg-slate-50 border border-transparent",
                  )}
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-xs shrink-0">
                    {initials(thread.patientName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{thread.patientName}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{thread.timeLabel}</span>
                    </div>
                    <p className="text-[11px] text-violet-700 truncate flex items-center gap-1 mt-0.5">
                      <Stethoscope className="h-3 w-3 shrink-0" />
                      {thread.doctorName}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{thread.lastMsg || "No messages yet"}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={cn("flex flex-col min-h-[420px]", !activeThread && "hidden lg:flex")}>
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-12 w-12 text-slate-200 mb-4" />
              <p className="font-semibold text-slate-900">Select a conversation</p>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                Choose a patient–physician thread to review messages for your brand.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={closeThread}
                  className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
                  aria-label="Back to threads"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{activeThread.patientName}</p>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" />
                    {activeThread.doctorName}
                  </p>
                </div>
                <Badge className="text-[9px] font-bold uppercase border bg-slate-100 text-slate-600">
                  Read-only
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const role = senderRole(msg.sender_id);
                  const isPatient = role === "patient";
                  return (
                    <div key={msg.id} className={cn("flex", isPatient ? "justify-start" : "justify-end")}>
                      <div
                        className={cn(
                          "max-w-[78%] px-4 py-2.5 rounded-2xl text-sm",
                          isPatient ? "bg-slate-100 text-slate-800" : "bg-violet-700 text-white",
                        )}
                      >
                        <p className="text-[10px] font-bold uppercase mb-1 opacity-70">{senderLabel(msg.sender_id)}</p>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p className={cn("text-[10px] mt-1.5", isPatient ? "text-slate-400" : "text-white/60 text-right")}>
                          {formatMessageTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
