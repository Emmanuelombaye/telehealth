import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore, Role } from "../../../lib/auth-store";
import { doctorPortalBaseFromPath } from "../../../lib/doctorPortalBase";
import { Lock, Mail, AlertCircle, Eye, EyeOff, ArrowLeft, Sparkles } from "lucide-react";
import { formatSupabaseSignInError } from "../../../lib/authErrors";
import {
  roleCanAccessPortal,
  portalHomePath,
  portalAccessDeniedMessage,
  suggestedPortalLoginForRole,
  type StaffPortal,
} from "../../../lib/portalAuth";
import { useBrand } from "../../context/BrandContext";
import { cn } from "../../components/ui/utils";
import {
  resolvePartnerHandoffContext,
  safeRedirectFromSearch,
  getPartnerBySlug,
} from "../../../lib/partners";

type Portal = StaffPortal;

const STAFF_PORTALS: Portal[] = ["doctor", "admin", "superadmin", "affiliate", "pharmacy"];

function isStaffPortal(portal: Portal): boolean {
  return STAFF_PORTALS.includes(portal);
}

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
  const [portalRedirect, setPortalRedirect] = useState<{ path: string; label: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const { brand, site, isWhiteLabel, patientPortalBase, enrollBase } = useBrand();
  const [existingSessionEmail, setExistingSessionEmail] = useState<string | null>(null);
  const initialize = useAuthStore(state => state.initialize);
  const signOut = useAuthStore(state => state.signOut);
  const cleanupDone = useRef(false);

  useEffect(() => {
    if (cleanupDone.current) return;
    cleanupDone.current = true;

    async function hydrate() {
      try {
        await initialize();
        const { session, role } = useAuthStore.getState();

        if (session?.user && role) {
          if (role === "super_admin" && portal === "superadmin") {
            navigate("/superadmin", { replace: true });
            return;
          }
          if (roleCanAccessPortal(role, portal)) {
            const redirect = safeRedirectFromSearch();
            navigate(
              redirect ?? portalHomePath(portal, window.location.pathname, patientPortalBase),
              { replace: true },
            );
            return;
          }
          setExistingSessionEmail(session.user.email ?? null);
        }
      } catch (err) {
        console.warn("[AuthPage] auth hydrate error:", err);
      } finally {
        setReady(true);
      }
    }
    void hydrate();
  }, [initialize, navigate, portal, patientPortalBase]);

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
        return `${patientPortalBase.replace(/\/$/, "")}${buster}`;
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
    setPortalRedirect(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const normalizedEmail = email.trim().toLowerCase();

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          if (isStaffPortal(portal)) {
            throw new Error(formatSupabaseSignInError(signInError));
          }
          throw signInError;
        }

        if (data.user) {
          await initialize();
          const role = useAuthStore.getState().role;

          const denied =
            (portal === "superadmin" && role !== "super_admin") ||
            (portal === "doctor" && role !== "doctor" && role !== "super_admin") ||
            (portal === "admin" && role !== "brand_admin" && role !== "super_admin") ||
            (portal === "affiliate" &&
              role !== "affiliate" &&
              role !== "super_admin") ||
            (portal === "pharmacy" &&
              role !== "pharmacy" &&
              role !== "doctor" &&
              role !== "brand_admin" &&
              role !== "super_admin");

          if (denied && role) {
            const { message, redirect } = portalAccessDeniedMessage(role, portal);
            setError(message);
            setPortalRedirect(redirect);
            await supabase.auth.signOut();
            await initialize();
            return;
          }

          if (role === 'super_admin') {
            navigate('/superadmin', { replace: true });
          } else {
            const redirect = safeRedirectFromSearch();
            navigate(
              redirect ?? portalHomePath(portal, window.location.pathname, patientPortalBase),
              { replace: true },
            );
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
            const redirect = safeRedirectFromSearch();
            navigate(
              redirect ?? portalHomePath(portal, window.location.pathname, patientPortalBase),
              { replace: true },
            );
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
          <img
            src={isWhiteLabel && portal === "patient" ? brand.logoUrl : "/PeakHealthLogo.png"}
            alt={brand.logoAlt}
            className={cn(
              "object-contain opacity-80",
              isWhiteLabel && portal === "patient" ? "h-16 w-16" : "h-20",
            )}
          />
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 border-2 border-slate-200 border-t-[#0A3622] rounded-full animate-spin" />
            <span className="text-sm font-medium tracking-wide text-slate-500">Preparing secure login...</span>
          </div>
        </div>
      </div>
    );
  }

  const portalTitle = (() => {
    switch (portal) {
      case "superadmin":
        return "Super Admin login";
      case "doctor":
        return "Provider login";
      case "admin":
        return "Admin login";
      case "pharmacy":
        return "Pharmacy login";
      case "affiliate":
        return "Affiliate partner login";
      default:
        return "Welcome back";
    }
  })();

  const portalSubtitle = (() => {
    switch (portal) {
      case "superadmin":
        return "Platform-wide access for Peak Health operators only.";
      case "doctor":
        return "Clinical queue, consults, eRx, and RPM.";
      case "admin":
        return "Brand operations, products, and orders.";
      case "pharmacy":
        return "Fulfillment, inventory, and shipping.";
      case "affiliate":
        return "Powered by Referly.so — referral links, tracking, and payouts.";
      case "patient":
        return isWhiteLabel
          ? `Sign in to your ${site.copy.portalName} patient portal.`
          : "Secure access for patients.";
      default:
        return "Secure access for clinicians and patients.";
    }
  })();

  const isPartnerPatientLogin = isWhiteLabel && portal === "patient";
  const { integration: partnerHandoff } = resolvePartnerHandoffContext();
  const pathPartner = getPartnerBySlug(brand.slug);
  const activePartner = partnerHandoff ?? pathPartner;
  const partnerBackHref = activePartner?.marketingShopUrl ?? enrollBase;
  const partnerBackLabel = activePartner ? `Back to ${activePartner.displayName}` : "Back to Home";
  const partnerHandoffMessage = activePartner?.handoffMessage;
  const loginLogoUrl =
    isPartnerPatientLogin && activePartner?.logoUrl ? activePartner.logoUrl : brand.logoUrl;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#FAFAFA] p-4 overflow-auto font-sans">
      {!isPartnerPatientLogin && (
        <a
          href="/"
          className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-[#8CA397] hover:text-[#0A3622] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </a>
      )}

      <div className="w-full max-w-[420px] space-y-6 pt-2 sm:pt-4">
        {isPartnerPatientLogin && (
          <a
            href={partnerBackHref}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8CA397] hover:text-[#0A3622] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {partnerBackLabel}
          </a>
        )}

        {partnerHandoffMessage && (
          <p className="text-center text-[13px] text-[#6A8074] leading-relaxed px-2">
            {partnerHandoffMessage}
          </p>
        )}

        <div
          className={cn(
            "flex flex-col items-center text-center",
            isPartnerPatientLogin ? "gap-4 mb-2" : "mb-6",
          )}
        >
          <img
            src={isPartnerPatientLogin ? loginLogoUrl : "/PeakHealthLogo.png"}
            alt={brand.logoAlt}
            className={cn(
              "object-contain",
              isPartnerPatientLogin
                ? "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] rounded-2xl shadow-sm"
                : "w-[min(100%,380px)] h-auto -mb-12",
            )}
          />
          <div className={cn("space-y-1.5", !isPartnerPatientLogin && "-mt-4")}>
            {portal === "affiliate" && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-800 mb-2">
                <Sparkles className="h-3 w-3" /> Referly.so
              </div>
            )}
            <h1
              className={cn(
                "text-[32px] font-medium tracking-tight",
                isPartnerPatientLogin ? "text-[#0f2341]" : "text-[#0A3622]",
              )}
              style={{ fontFamily: "Georgia, serif" }}
            >
              {portalTitle}
            </h1>
            <p className="text-[14px] text-[#6A8074] max-w-[28ch] mx-auto leading-relaxed">
              {portalSubtitle}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60">
          <form onSubmit={handleAuth} className="space-y-5">
            {existingSessionEmail && (
              <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <p>
                  This tab is signed in as <strong>{existingSessionEmail}</strong>, which cannot open this portal.
                  Other tabs stay signed in separately.
                </p>
                {(() => {
                  const role = useAuthStore.getState().role;
                  const suggested = suggestedPortalLoginForRole(role);
                  if (!suggested || roleCanAccessPortal(role, portal)) return null;
                  return (
                    <a
                      href={suggested.path}
                      className="mt-2 inline-block text-xs font-bold text-amber-900 underline"
                    >
                      Go to {suggested.label} portal
                    </a>
                  );
                })()}
                <button
                  type="button"
                  className="mt-2 block text-xs font-bold text-amber-900 underline"
                  onClick={async () => {
                    await signOut();
                    setExistingSessionEmail(null);
                  }}
                >
                  Sign out in this tab only
                </button>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-[14px] text-sm bg-red-50 border border-red-100 text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p>{error}</p>
                  {portalRedirect && (
                    <a
                      href={portalRedirect.path}
                      className="inline-block text-xs font-bold text-red-700 underline hover:text-red-800"
                    >
                      Sign in at the {portalRedirect.label} portal →
                    </a>
                  )}
                </div>
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
