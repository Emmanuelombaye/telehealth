import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Video, Mic, MicOff, VideoOff, ShieldCheck,
  ArrowLeft, Activity, Loader2, MessageSquare, PhoneOff
} from "lucide-react";
import { cn } from "../../../components/ui/shared.tsx";
import { useAuthStore } from "../../../../lib";
import { supabase } from "../../../../lib/supabaseClient";

// ── Zoom Video SDK ────────────────────────────────────────────────────────────
// Loaded lazily so the heavy SDK bundle only parses when the patient actually
// enters the consult page (not on every page load).
type ZoomClient = ReturnType<typeof import("@zoom/videosdk")["createClient"]>;
type ZoomStream = Awaited<ReturnType<ZoomClient["getMediaStream"]>>;

// ── ZoomVideoRoom component ───────────────────────────────────────────────────
// Isolated so it mounts/unmounts cleanly without touching the rest of the page.
function ZoomVideoRoom({
  sessionName,
  token,
  sdkKey,
  displayName,
  onLeave,
}: {
  sessionName: string;
  token: string;
  sdkKey: string;
  displayName: string;
  onLeave: () => void;
}) {
  const clientRef = useRef<ZoomClient | null>(null);
  const streamRef = useRef<ZoomStream | null>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const leave = useCallback(async () => {
    try {
      const client = clientRef.current;
      if (client) {
        await client.leave();
      }
    } catch (_) {
      // ignore — already left or never joined
    }
    onLeave();
  }, [onLeave]);

  useEffect(() => {
    let cancelled = false;

    async function join() {
      try {
        // Lazy-load the SDK so it doesn't bloat the initial bundle
        const ZoomVideo = (await import("@zoom/videosdk")).default;
        const client = ZoomVideo.createClient();
        clientRef.current = client;

        await client.init("en-US", "Global", { patchJsMedia: true });

        await client.join(sessionName, token, displayName);

        if (cancelled) return;

        const stream = await client.getMediaStream();
        streamRef.current = stream;

        // Start self video
        if (selfVideoRef.current) {
          await stream.startVideo({ videoElement: selfVideoRef.current });
        }

        // Start audio
        await stream.startAudio();

        setStatus("connected");

        // Render any participants already in the session
        const renderRemote = async () => {
          const participants = client.getAllUser();
          const remote = participants.find((p) => p.userId !== client.getCurrentUserInfo().userId);
          if (remote && remoteVideoRef.current) {
            await stream.renderVideo(
              remoteVideoRef.current,
              remote.userId,
              remoteVideoRef.current.clientWidth || 640,
              remoteVideoRef.current.clientHeight || 480,
              0,
              0,
              3, // VideoQuality.Video_360P
            );
          }
        };

        await renderRemote();

        // Listen for new participants joining
        client.on("user-added", renderRemote);
        client.on("user-updated", renderRemote);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Zoom join error:", msg);
        setErrorMsg(msg);
        setStatus("error");
      }
    }

    void join();

    return () => {
      cancelled = true;
      // Cleanup on unmount
      void (async () => {
        try {
          const client = clientRef.current;
          if (client) await client.leave();
        } catch (_) { /* ignore */ }
      })();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionName, token, displayName]);

  const toggleMute = async () => {
    const stream = streamRef.current;
    if (!stream) return;
    try {
      if (isMuted) {
        await stream.unmuteAudio();
      } else {
        await stream.muteAudio();
      }
      setIsMuted((m) => !m);
    } catch (e) {
      console.warn("Toggle mute error:", e);
    }
  };

  const toggleVideo = async () => {
    const stream = streamRef.current;
    if (!stream) return;
    try {
      if (isVideoOff) {
        if (selfVideoRef.current) {
          await stream.startVideo({ videoElement: selfVideoRef.current });
        }
      } else {
        await stream.stopVideo();
      }
      setIsVideoOff((v) => !v);
    } catch (e) {
      console.warn("Toggle video error:", e);
    }
  };

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center">
          <Video className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-white font-bold">Could not connect to video session</p>
        <p className="text-white/60 text-sm max-w-xs">{errorMsg}</p>
        <button
          onClick={onLeave}
          className="mt-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-10 text-xs font-bold uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
        <p className="text-white/70 text-sm font-bold uppercase tracking-widest">
          Connecting to secure session…
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Remote (doctor) video — fills the frame */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Self (patient) picture-in-picture */}
      <video
        ref={selfVideoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "absolute bottom-20 right-4 w-32 h-24 rounded-xl object-cover border-2 border-white/20 shadow-lg",
          isVideoOff && "hidden",
        )}
      />

      {/* Controls bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-20">
        <button
          onClick={toggleMute}
          className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0",
            isMuted
              ? "bg-red-500 text-white shadow-lg shadow-red-500/40"
              : "bg-white/20 text-white hover:bg-white/30",
          )}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        <button
          onClick={toggleVideo}
          className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0",
            isVideoOff
              ? "bg-red-500 text-white shadow-lg shadow-red-500/40"
              : "bg-white/20 text-white hover:bg-white/30",
          )}
          title={isVideoOff ? "Start video" : "Stop video"}
        >
          {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
        </button>

        <div className="h-6 w-px bg-white/20 mx-1" />

        <button
          onClick={leave}
          className="h-11 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-md shadow-red-600/30 transition-all"
        >
          <PhoneOff className="h-4 w-4" /> Leave
        </button>
      </div>
    </div>
  );
}

// ── Main patient consult page ─────────────────────────────────────────────────
export function PatientConsultPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);

  // Zoom Video SDK session state
  const [zoomToken, setZoomToken] = useState<string | null>(null);
  const [zoomSdkKey, setZoomSdkKey] = useState<string>("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Fetch the active order with a live video session
  useEffect(() => {
    if (!user?.id) return;

    const fetchActiveConsult = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("consultation_live", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setOrder(data[0]);
      }
      setLoading(false);
    };

    fetchActiveConsult();

    // Subscribe to real-time changes — if doctor goes live, patient instantly sees it
    const channel = supabase
      .channel("patient_consult_live")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.consultation_live) {
            setOrder(updated);
          } else if (order?.id === updated.id && !updated.consultation_live) {
            setOrder(null);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Fetch a Zoom Video SDK token when the patient clicks "Join"
  const fetchZoomToken = useCallback(async (sessionName: string) => {
    setTokenLoading(true);
    setTokenError(null);
    try {
      const displayName =
        user?.user_metadata?.first_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name ?? ""}`.trim()
          : user?.email ?? "Patient";

      const { data, error } = await supabase.functions.invoke("zoom-video-token", {
        body: {
          sessionName,
          role: 0, // 0 = attendee
          userIdentity: displayName,
        },
      });

      if (error || !data?.token) {
        throw new Error(error?.message ?? "Could not get video token");
      }

      setZoomToken(data.token);
      setZoomSdkKey(data.sdkKey ?? "");
      setInCall(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTokenError(msg);
    } finally {
      setTokenLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-5">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Checking for active consultation...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center p-6">
        <div className="h-24 w-24 rounded-[2rem] bg-slate-100 flex items-center justify-center">
          <Video className="h-12 w-12 text-slate-300" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#0A2E1F] mb-2">No Active Consultation</h2>
          <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
            Your doctor has not started a live video session yet. This page will
            automatically update the moment your doctor connects.
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
            Listening for doctor connection...
          </span>
        </div>
        <button
          onClick={() => navigate("/patient")}
          className="flex items-center gap-2 text-slate-500 hover:text-[#0A2E1F] text-sm font-bold uppercase tracking-widest transition-all mt-4"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </button>
      </div>
    );
  }

  // Session name is derived from the order id — same logic as before, different provider
  const sessionName = `peak-health-consult-${order.id}`;

  const displayName =
    user?.user_metadata?.first_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name ?? ""}`.trim()
      : user?.email ?? "Patient";

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in duration-700 pb-10">
      {/* Header — unchanged */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 flex flex-wrap items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/patient")}
            className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 flex items-center justify-center transition-all text-slate-500 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#0A2E1F] leading-tight">
              Live Consultation
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">
              Step 9 of 9 · Patient portal — secure live session
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Doctor Is Live — Join Now
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">HIPAA Secure</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
            <span className="text-xs font-bold text-slate-600">Physician:</span>
            <span className="text-xs font-bold text-[#0A2E1F]">{order.doctor || "Your Assigned Doctor"}</span>
          </div>
        </div>
      </div>

      {/* Video Container — same outer shell, Zoom Video SDK inside */}
      <div className="bg-[#050907] rounded-[2rem] w-full h-[480px] sm:h-[560px] relative overflow-hidden shadow-2xl border border-slate-200 flex items-center justify-center">

        {/* Live Indicator */}
        <div className="absolute top-5 left-5 z-20 flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full shadow-lg">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE</span>
        </div>

        {/* HIPAA badge */}
        <div className="absolute top-5 right-5 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 text-white">
          <ShieldCheck className="h-3 w-3" />
          <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
        </div>

        {inCall && zoomToken ? (
          // ── Zoom Video SDK session ──────────────────────────────────────────
          <ZoomVideoRoom
            sessionName={sessionName}
            token={zoomToken}
            sdkKey={zoomSdkKey}
            displayName={displayName}
            onLeave={() => {
              setInCall(false);
              setZoomToken(null);
              navigate("/patient");
            }}
          />
        ) : (
          // ── Pre-call lobby — identical to before ───────────────────────────
          <div className="text-center p-8 flex flex-col items-center justify-center gap-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-700 to-[#0A2E1F] flex items-center justify-center shadow-2xl shadow-emerald-900/50 mb-2">
              <Video className="h-10 w-10 text-white" />
            </div>
            <div>
              <p className="text-white text-2xl font-bold mb-2 tracking-tight">Your Doctor is Ready</p>
              <p className="text-emerald-400/80 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                Your physician is waiting in the secure consultation room. Click below to connect instantly.
              </p>
            </div>

            {tokenError && (
              <div className="bg-red-900/60 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-200 max-w-xs text-center">
                {tokenError}
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Secure Room Ready</span>
              </div>
            </div>

            <button
              disabled={tokenLoading}
              onClick={() => fetchZoomToken(sessionName)}
              className="mt-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-full px-10 h-14 font-bold tracking-widest uppercase text-sm shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.7)] flex items-center gap-3"
            >
              {tokenLoading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Connecting…</>
              ) : (
                <><Video className="h-5 w-5" /> Join Consultation Now</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info Strip — unchanged */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Consultation Type", value: order.category || "Medical Review" },
          { label: "Medication", value: order.medication || "Pending Review" },
          { label: "Order Reference", value: order.order_number || order.id?.slice(0, 8) },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-sm font-bold text-[#0A2E1F] truncate">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
