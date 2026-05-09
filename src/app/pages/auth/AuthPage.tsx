import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore, Role } from "../../../lib/auth-store";
import { Lock, Mail, AlertCircle, Stethoscope, Shield, User, Eye, EyeOff, ArrowLeft, Pill, KeyRound, Building2, Heart } from "lucide-react";

type Portal = 'patient' | 'doctor' | 'admin' | 'superadmin' | 'pharmacy';

// Portal navigation data for the quick-switch section
const PORTAL_NAV: { key: Portal; label: string; path: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
  { key: 'patient',    label: 'Patient',    path: '/patient/login',    icon: <Heart className="h-3.5 w-3.5" />,       color: 'text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10',   activeColor: 'text-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-500/30' },
  { key: 'doctor',     label: 'Provider',   path: '/doctor/login',     icon: <Stethoscope className="h-3.5 w-3.5" />, color: 'text-blue-400/70 hover:text-blue-400 hover:bg-blue-500/10',             activeColor: 'text-blue-400 bg-blue-500/20 ring-1 ring-blue-500/30' },
  { key: 'admin',      label: 'Admin',      path: '/admin/login',      icon: <Building2 className="h-3.5 w-3.5" />,   color: 'text-violet-400/70 hover:text-violet-400 hover:bg-violet-500/10',       activeColor: 'text-violet-400 bg-violet-500/20 ring-1 ring-violet-500/30' },
  { key: 'superadmin', label: 'SuperAdmin', path: '/superadmin/login', icon: <KeyRound className="h-3.5 w-3.5" />,    color: 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10',               activeColor: 'text-red-400 bg-red-500/20 ring-1 ring-red-500/30' },
  { key: 'pharmacy',   label: 'Pharmacy',   path: '/pharmacy/login',   icon: <Pill className="h-3.5 w-3.5" />,        color: 'text-teal-400/70 hover:text-teal-400 hover:bg-teal-500/10',             activeColor: 'text-teal-400 bg-teal-500/20 ring-1 ring-teal-500/30' },
];


export function AuthPage({ portal }: { portal: Portal }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const initialize = useAuthStore(state => state.initialize);
  const cleanupDone = useRef(false);

  // ── OPTIMIZED: Faster login page preparation ──
  useEffect(() => {
    if (cleanupDone.current) return;
    cleanupDone.current = true;

    async function cleanup() {
      try {
        // 1. Explicitly clear local dev roles
        localStorage.removeItem('peak_health_dev_role');
        
        // 2. Check for existing session first - if none, we skip sign out (faster)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Only sign out if there's actually someone logged in
          await supabase.auth.signOut();
          await initialize(null); // Explicitly pass null to clear
        } else {
          // 3. Re-initialize auth store with null session (already fetched)
          await initialize(null);
        }
      } catch (err) {
        console.warn('[AuthPage] Initialization cleanup error:', err);
      } finally {
        setReady(true);
      }
    }
    cleanup();
  }, [initialize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Portal target path — always go to the portal the user is logging into
  const portalTarget = (p: Portal) => {
    switch (p) {
      case 'doctor':     return '/doctor';
      case 'admin':      return '/admin';
      case 'superadmin': return '/superadmin';
      case 'pharmacy':   return '/pharmacy';
      default:           return '/patient';
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your credentials."); return; }
    if (mode === 'signup' && (!firstName || !lastName)) { setError("Please enter your full name."); return; }
    
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        // ── Step 1: Always attempt real Supabase sign-in first ──
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        // ── Step 2: Define Staff/Bypass Roles ──
        const staffAccounts: Record<string, { role: Role; password?: string }> = {
          'doctor@peakbodyco.com':   { role: 'doctor' },
          'admin@peakbodyco.com':    { role: 'brand_admin' },
          'pharmacy@peakbodyco.com': { role: 'pharmacy' },
          'brandon@peakbodyco.com':  { role: 'super_admin' },
        };
        const staffEntry = staffAccounts[email.toLowerCase()];

        if (signInError) {
          // If login fails, check if it's a staff account we should bypass (for dev/testing)
          if (staffEntry) {
            console.warn('[Auth] Real login failed, using dev override for staff:', email);
            localStorage.setItem('peak_health_dev_role', staffEntry.role as string);
            await initialize();
            navigate(portalTarget(portal), { replace: true });
            return;
          }
          throw signInError;
        }
        
        if (data.user) {
          // ── Step 3: Handle Successful Login ──
          if (staffEntry) {
            // Force the staff role even if metadata differs
            localStorage.setItem('peak_health_dev_role', staffEntry.role as string);
          } else {
            // Normal user — clear any previous dev bypasses
            localStorage.removeItem('peak_health_dev_role');
          }

          await initialize();
          const role = useAuthStore.getState().role;
          
          // ── Step 4: Portal Access Control ──
          // Allow super_admin anywhere, otherwise restrict by portal
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
            if (portal === 'pharmacy' && role !== 'pharmacy') {
              setError("Access denied. Pharmacy portal requires a pharmacy account.");
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
          }
          
          // ── Step 5: Navigate to THIS portal ──
          navigate(portalTarget(portal), { replace: true });
        }
      } else {
        // ── Sign Up Flow ──
        const portalRole = 
          portal === 'doctor' ? 'doctor' : 
          portal === 'admin' ? 'brand_admin' : 
          portal === 'superadmin' ? 'super_admin' : 
          portal === 'pharmacy' ? 'pharmacy' : 
          'patient';

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
            setError("Account created! Please check your email for a confirmation link.");
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

  // ─── Portal-specific visual configurations ───
  const configs = {
    patient: {
      bg: "bg-gradient-to-br from-[#f3eeff] via-[#F2FFF8] to-[#D6F0FF]",
      card: "bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl",
      accent: "bg-emerald-600 hover:bg-emerald-700",
      ring: "focus:border-emerald-500",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      icon: <User className="h-8 w-8" />,
      title: "Patient Portal",
      subtitle: "Sign in to access your prescriptions, orders, and care team",
      badge: "🏥 HIPAA Secure",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    doctor: {
      bg: "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900",
      card: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl",
      accent: "bg-blue-500 hover:bg-blue-600",
      ring: "focus:border-blue-400",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-300",
      icon: <Stethoscope className="h-8 w-8" />,
      title: "Provider Portal",
      subtitle: "Clinical access for licensed medical personnel only",
      badge: "🔒 Authorized Access",
      badgeClass: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    },
    admin: {
      bg: "bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900",
      card: "bg-white/8 backdrop-blur-xl border border-white/15 shadow-2xl",
      accent: "bg-violet-600 hover:bg-violet-700",
      ring: "focus:border-violet-400",
      iconBg: "bg-violet-500/20",
      iconColor: "text-violet-300",
      icon: <Shield className="h-8 w-8" />,
      title: "Admin Portal",
      subtitle: "Brand management and operations — authorized personnel only",
      badge: "⚙️ Staff Only",
      badgeClass: "bg-violet-500/20 text-violet-200 border-violet-500/30",
    },
    superadmin: {
      bg: "bg-gradient-to-br from-red-950 via-slate-950 to-slate-900",
      card: "bg-white/8 backdrop-blur-xl border border-red-500/20 shadow-2xl",
      accent: "bg-red-600 hover:bg-red-700",
      ring: "focus:border-red-400",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      icon: <Lock className="h-8 w-8" />,
      title: "System Access",
      subtitle: "Master system administration — restricted",
      badge: "🔐 Top Secret",
      badgeClass: "bg-red-500/20 text-red-300 border-red-500/30",
    },
    pharmacy: {
      bg: "bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900",
      card: "bg-white/8 backdrop-blur-xl border border-emerald-500/20 shadow-2xl",
      accent: "bg-emerald-600 hover:bg-emerald-700",
      ring: "focus:border-emerald-400",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      icon: <Pill className="h-8 w-8 text-emerald-400" />,
      title: "Pharmacy Portal",
      subtitle: "Inventory and prescription fulfillment control",
      badge: "💊 Fulfillment Center",
      badgeClass: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
    },
  };

  const c = configs[portal];
  const isDark = portal !== 'patient';
  const inputCls = isDark
    ? `w-full rounded-xl pl-10 pr-10 py-3 text-sm border bg-white/10 border-white/20 text-white placeholder-white/40 focus:outline-none ${c.ring} transition-colors`
    : `w-full rounded-xl pl-10 pr-10 py-3 text-sm border border-gray-200 bg-white focus:outline-none ${c.ring} transition-colors text-slate-800`;
  const labelCls = isDark ? "text-[11px] font-bold uppercase tracking-wide text-white/50 mb-1 block" : "text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1 block";

  // Show loading while cleaning up old session
  if (!ready) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center ${c.bg}`}>
        <div className="flex flex-col items-center gap-4">
          <img src="/originallogo.png" alt="Peak Health" className="h-14 object-contain opacity-80" />
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
            <span className={`text-sm font-medium tracking-wide ${isDark ? 'text-white/50' : 'text-slate-400'}`}>Preparing secure login...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${c.bg} p-4 overflow-auto`}>
      {/* Back to home */}
      <a href="/" className={`absolute top-6 left-6 flex items-center gap-2 text-xs font-bold ${isDark ? 'text-white/40 hover:text-white/80' : 'text-slate-400 hover:text-slate-700'} transition-colors`}>
        <ArrowLeft className="h-4 w-4" /> Back to Peak Health
      </a>

      <div className="w-full max-w-md space-y-5">
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/originallogo.png" alt="Peak Health" className="h-28 object-contain" />
        </div>

        {/* Portal Card */}
        <div className={`rounded-3xl p-8 ${c.card}`}>
          {/* Icon + Title */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl ${c.iconBg} ${c.iconColor} mb-4`}>
              {c.icon}
            </div>
            <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.title}</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{c.subtitle}</p>
            <span className={`inline-block mt-3 text-[10px] font-bold px-3 py-1 rounded-full border ${c.badgeClass}`}>{c.badge}</span>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Mode Switcher */}
            <div className={`flex p-1 rounded-xl mb-4 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <button 
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'login' ? (isDark ? 'bg-white/15 shadow-sm text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-500 hover:text-slate-700')}`}
              >
                Login
              </button>
              <button 
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'signup' ? (isDark ? 'bg-white/15 shadow-sm text-white' : 'bg-white shadow-sm text-slate-900') : (isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-500 hover:text-slate-700')}`}
              >
                Create Account
              </button>
            </div>

            {/* Error / Success */}
            {error && (
              <div className={`flex flex-col gap-2 p-3 rounded-xl text-sm ${error.includes('created') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
                {error === "Invalid login credentials" && (
                  <p className="text-[10px] font-bold opacity-80 pl-6">
                    If this is a new account, use the 
                    <button type="button" onClick={() => setMode('signup')} className="underline ml-1">Create Account</button> tab first.
                  </p>
                )}
              </div>
            )}

            {/* Name Fields for Signup */}
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    className={inputCls.replace('pl-10', 'pl-4')}
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                    className={inputCls.replace('pl-10', 'pl-4')}
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className={labelCls}>Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3.5 h-4 w-4 ${isDark ? 'text-white/30' : 'text-slate-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputCls}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-3.5 h-4 w-4 ${isDark ? 'text-white/30' : 'text-slate-400'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={inputCls}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3.5 ${isDark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'} transition-colors`}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-xl text-sm font-black text-white tracking-widest uppercase transition-all ${c.accent} disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : mode === 'login' ? "Secure Login" : "Create Account"}
            </button>
          </form>

          {/* ── Enhanced Portal Switcher ── */}
          <div className={`mt-10 pt-8 space-y-4 ${isDark ? 'border-t border-white/10' : 'border-t border-slate-100'}`}>
            <div className="flex flex-col items-center gap-1">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                Access Secure Portals
              </p>
              <div className="h-0.5 w-8 bg-emerald-500/30 rounded-full" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {PORTAL_NAV.map(p => (
                <a
                  key={p.key}
                  href={p.path}
                  className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    p.key === portal
                      ? `${p.activeColor} border-transparent shadow-lg shadow-${p.key === 'superadmin' ? 'red' : p.key === 'admin' ? 'violet' : 'emerald'}-500/10`
                      : `${isDark ? 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/10' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:text-slate-900 hover:border-slate-200 hover:shadow-sm'}`
                  }`}
                >
                  <span className="opacity-70">{p.icon}</span>
                  {p.label}
                </a>
              ))}
            </div>
            
            <p className={`text-[9px] text-center italic mt-4 ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
              Click to jump to a different access point
            </p>
          </div>

          {/* Patient: link to shop */}
          {portal === 'patient' && (
            <p className="text-center text-sm text-slate-400 mt-5">
              New patient?{" "}
              <a href="/" className="text-emerald-600 font-black hover:underline">
                Start with a treatment →
              </a>
            </p>
          )}
        </div>

        {/* Security footer */}
        <p className={`text-center text-[10px] ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
          256-bit SSL · HIPAA Compliant · Peak Health Technology Group, Inc.
        </p>
      </div>
    </div>
  );
}
