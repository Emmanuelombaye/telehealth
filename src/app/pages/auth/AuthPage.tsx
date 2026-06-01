import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore, Role } from "../../../lib/auth-store";
import { doctorPortalBaseFromPath } from "../../../lib/doctorPortalBase";
import { Lock, Mail, AlertCircle, Eye, EyeOff, ArrowLeft, Sparkles } from "lucide-react";
import {
  clearDemoAuth,
  matchStaffDemo,
  persistDemoAuth,
} from "../../../lib/staffDemoAuth";

type Portal = "patient" | "doctor" | "admin" | "superadmin" | "affiliate" | "pharmacy";

export function AuthPage({ portal }: { portal: Portal }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const initialize = useAuthStore(state => state.initialize);
  const cleanupDone = useRef(false);

  // ── OPTIMIZED: Faster login page preparation ──
  useEffect(() => {
    if (cleanupDone.current) return;
    cleanupDone.current = true;

    async function cleanup() {
      try {
        clearDemoAuth();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          await supabase.auth.signOut();
          await initialize(null);
        } else {
          await initialize(null);
        }
      } catch (err) {
        console.warn('[AuthPage] Initialization cleanup error:', err);
      } finally {
        setReady(true);
      }
    }
    cleanup();
  }, [initialize]);

  const portalTarget = (p: Portal) => {
    const buster = `?v=${Date.now()}`;
    switch (p) {
      case 'doctor': {
        const base =
          typeof window !== 'undefined'
            ? doctorPortalBaseFromPath(window.location.pathname)
            : '/doctor';
        return `${base}${buster}`;
      }
      case 'admin':
        return `/admin${buster}`;
      case 'superadmin':
        return `/superadmin${buster}`;
      case 'affiliate':
        return `/affiliate${buster}`;
      case 'pharmacy':
        return `/pharmacy${buster}`;
      default:
        return `/patient${buster}`;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSuccessMsg("If this email exists, a password reset link has been sent.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'forgot_password') {
      return handleForgotPassword(e);
    }

    if (!email || !password) { setError("Please enter your credentials."); return; }
    if (mode === 'signup') {
      if (!firstName || !lastName) { setError("Please enter your full name."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    }
    
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInError) {
          const demo = matchStaffDemo(email, password);
          if (demo) {
            if (portal === "superadmin" || portal === "doctor") {
              throw new Error(
                portal === "superadmin"
                  ? "Super Admin requires a live Supabase login (Edge Functions). Create brandon@peakbodyco.com in Supabase Auth → Users with role super_admin."
                  : "Provider portal requires a live Supabase login (Edge Functions). Create doctor@peakbodyco.com in Supabase Auth → Users with role doctor.",
              );
            }
            persistDemoAuth(demo);
            await initialize();
            navigate(portalTarget(portal), { replace: true });
            return;
          }
          throw signInError;
        }
        
        if (data.user) {
          clearDemoAuth();

          await initialize();
          const role = useAuthStore.getState().role;
          
          if (role !== 'super_admin') {
            if (portal === 'superadmin') {
              setError("Access denied. Super Admin portal only.");
              await supabase.auth.signOut();
              await initialize();
              return;
            }
            if (portal === 'doctor' && role !== 'doctor') {
              setError("Access denied. Provider portal requires a doctor account.");
              await supabase.auth.signOut();
              await initialize();
              return;
            }
            if (portal === 'admin' && role !== 'brand_admin') {
              setError("Access denied. Admin portal only.");
              await supabase.auth.signOut();
              await initialize();
              return;
            }
            if (
              portal === 'affiliate' &&
              role !== 'affiliate' &&
              role !== 'super_admin'
            ) {
              setError("Access denied. Affiliate portal only.");
              await supabase.auth.signOut();
              await initialize();
              return;
            }
            if (
              portal === 'pharmacy' &&
              role !== 'pharmacy' &&
              role !== 'doctor' &&
              role !== 'brand_admin' &&
              role !== 'super_admin'
            ) {
              setError("Access denied. Pharmacy portal only.");
              await supabase.auth.signOut();
              await initialize();
              return;
            }
          }
          
          if (role === 'super_admin') {
            navigate('/superadmin', { replace: true });
          } else {
            navigate(portalTarget(portal), { replace: true });
          }
        }
      } else if (mode === 'signup') {
        if (portal !== 'patient') {
          setError("Registration is only available for patients.");
          return;
        }
        const portalRole = 'patient';

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim(),
              role: portalRole
            }
          }
        });
        if (signUpError) throw signUpError;
        
        if (data.user) {
          if (data.session) {
            await initialize();
            navigate(portalTarget(portal), { replace: true });
          } else {
            setSuccessMsg("Account created! Please check your email for a confirmation link.");
            setMode('login');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <img src="/PeakHealthLogo.png" alt="Peak Health" className="h-20 object-contain opacity-80" />
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 border-2 border-slate-200 border-t-[#0A3622] rounded-full animate-spin" />
            <span className="text-sm font-medium tracking-wide text-slate-500">Preparing secure login...</span>
          </div>
        </div>
      </div>
    );
  }

  const portalTitle =
    portal === "affiliate" ? "Affiliate partner login" : "Welcome back";

  const portalSubtitle =
    portal === "affiliate"
      ? "Powered by Referly.so — referral links, tracking, and payouts."
      : "Secure access for clinicians and patients.";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#FAFAFA] p-4 overflow-auto font-sans">
      <a href="/" className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-[#8CA397] hover:text-[#0A3622] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </a>

      <div className="w-full max-w-[420px] space-y-6 pt-4">
        <div className="flex flex-col items-center text-center mb-6">
          <img src="/PeakHealthLogo.png" alt="Peak Health" className="w-[380px] h-auto object-contain -mb-12" />
          <div className="space-y-1.5 -mt-4">
            {portal === "affiliate" && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-800 mb-2">
                <Sparkles className="h-3 w-3" /> Referly.so
              </div>
            )}
            <h1 className="text-[32px] text-[#0A3622] font-medium tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              {portalTitle}
            </h1>
            <p className="text-[14px] text-[#6A8074]">
              {portalSubtitle}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60">
          {portal === "affiliate" && mode === "login" && (
            <div className="mb-5 rounded-[14px] border border-emerald-100 bg-emerald-50/80 p-4 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-1">Demo partner account</p>
              <p className="text-[13px] text-emerald-900 font-mono">affiliate@peakbodyco.com</p>
              <p className="text-[13px] text-emerald-900 font-mono">password123</p>
              <p className="text-[11px] text-emerald-700/80 mt-2 leading-relaxed">
                Preview dashboard syncs with Referly on production once VITE_REFERLY_SITE_ID is set.
              </p>
            </div>
          )}
          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-[14px] text-sm bg-red-50 border border-red-100 text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            {successMsg && (
              <div className="flex items-start gap-2 p-3 rounded-[14px] text-sm bg-emerald-50 border border-emerald-100 text-emerald-700">
                <p>{successMsg}</p>
              </div>
            )}

            {mode === 'signup' && portal === 'patient' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#8CA397]">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    className="w-full rounded-[14px] px-4 py-3.5 text-[13px] border border-slate-200 bg-white placeholder:text-[#A0B3A8] focus:outline-none focus:border-[#0A3622] focus:ring-1 focus:ring-[#0A3622]/20 transition-all text-slate-800"
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#8CA397]">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    className="w-full rounded-[14px] px-4 py-3.5 text-[13px] border border-slate-200 bg-white placeholder:text-[#A0B3A8] focus:outline-none focus:border-[#0A3622] focus:ring-1 focus:ring-[#0A3622]/20 transition-all text-slate-800"
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#8CA397]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-[15px] h-[16px] w-[16px] text-[#A0B3A8]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-[14px] pl-[42px] pr-4 py-3.5 text-[14px] border border-slate-200 bg-white placeholder:text-[#A0B3A8] focus:outline-none focus:border-[#0A3622] focus:ring-1 focus:ring-[#0A3622]/20 transition-all text-slate-800"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {mode !== 'forgot_password' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#8CA397]">Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot_password'); setError(null); setSuccessMsg(null); }}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#8CA397] hover:text-[#0A3622] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-[15px] h-[16px] w-[16px] text-[#A0B3A8]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={`w-full rounded-[14px] pl-[42px] pr-10 py-3.5 text-[14px] border border-slate-200 bg-white placeholder:text-[#A0B3A8] focus:outline-none focus:border-[#0A3622] focus:ring-1 focus:ring-[#0A3622]/20 transition-all text-slate-800 font-medium ${!showPassword ? 'tracking-[0.2em]' : ''}`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[15px] text-[#A0B3A8] hover:text-[#6A8074] transition-colors">
                    {showPassword ? <EyeOff className="h-[16px] w-[16px]" /> : <Eye className="h-[16px] w-[16px]" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && portal === 'patient' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8CA397]">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-[15px] h-[16px] w-[16px] text-[#A0B3A8]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full rounded-[14px] pl-[42px] pr-10 py-3.5 text-[14px] border border-slate-200 bg-white placeholder:text-[#A0B3A8] focus:outline-none focus:border-[#0A3622] focus:ring-1 focus:ring-[#0A3622]/20 transition-all text-slate-800 font-medium ${!showPassword ? 'tracking-[0.2em]' : ''}`}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-[14px] text-[14px] font-medium text-white transition-all bg-[#0A3622] hover:bg-[#072B1A] disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : mode === 'login' ? "Sign in" : mode === 'signup' ? "Create Account" : "Send Reset Link"}
            </button>
          </form>

          {mode === 'forgot_password' && (
             <div className="mt-6 text-center">
              <button 
                type="button" 
                onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                className="text-[13px] text-[#6A8074] hover:text-[#0A3622] font-medium"
              >
                Back to Sign in
              </button>
            </div>
          )}

          {portal === 'patient' && mode !== 'forgot_password' && (
            <div className="mt-6 text-center">
              {mode === 'login' ? (
                <p className="text-[13px] text-[#6A8074]">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => { setMode('signup'); setError(null); }} className="text-[#0A3622] font-semibold hover:underline">
                    Create one
                  </button>
                </p>
              ) : (
                <p className="text-[13px] text-[#6A8074]">
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setMode('login'); setError(null); }} className="text-[#0A3622] font-semibold hover:underline">
                    Sign in
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
