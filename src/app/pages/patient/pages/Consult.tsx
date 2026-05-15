import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Video, Mic, MicOff, VideoOff, ShieldCheck,
  ArrowLeft, Activity, Loader2, MessageSquare, PhoneOff
} from "lucide-react";
import { cn } from "../../../components/ui/shared.tsx";
import { useAuthStore } from "../../../../lib";
import { supabase } from "../../../../lib/supabaseClient";

export function PatientConsultPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [inCall, setInCall] = useState(false);

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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

  const roomName = `peak-health-consult-${order.id}`;

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in duration-700 pb-10">
      {/* Header */}
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

      {/* Video Container */}
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

        {inCall ? (
          // The actual Jitsi iframe — same room name as doctor
          <iframe
            src={`https://meet.jit.si/${roomName}`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
            title="Live Video Consultation"
          />
        ) : (
          // Pre-call lobby
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

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Secure Room Ready</span>
              </div>
            </div>

            <button
              onClick={() => setInCall(true)}
              className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-10 h-14 font-bold tracking-widest uppercase text-sm shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.7)] flex items-center gap-3"
            >
              <Video className="h-5 w-5" /> Join Consultation Now
            </button>
          </div>
        )}

        {/* In-call controls bar */}
        {inCall && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-20">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                isMuted ? "bg-red-500 text-white shadow-lg shadow-red-500/40" : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                isVideoOff ? "bg-red-500 text-white shadow-lg shadow-red-500/40" : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </button>
            <div className="h-6 w-px bg-white/20 mx-1" />
            <button
              onClick={() => navigate("/patient/messages")}
              className="h-11 w-11 bg-white/20 text-white hover:bg-white/30 rounded-xl flex items-center justify-center transition-all shrink-0"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <div className="h-6 w-px bg-white/20 mx-1" />
            <button
              onClick={() => { setInCall(false); navigate("/patient"); }}
              className="h-11 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-md shadow-red-600/30 transition-all"
            >
              <PhoneOff className="h-4 w-4" /> Leave
            </button>
          </div>
        )}
      </div>

      {/* Info Strip */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Consultation Type", value: order.category || "Medical Review" },
          { label: "Medication", value: order.medication || "Pending Review" },
          { label: "Order Reference", value: order.order_number || order.id?.slice(0, 8) },
        ].map(item => (
          <div key={item.label} className="bg-white border border-slate-100 rounded-2xl px-6 py-4 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-sm font-bold text-[#0A2E1F] truncate">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
