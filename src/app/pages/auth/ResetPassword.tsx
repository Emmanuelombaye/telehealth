import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../../lib/supabaseClient";
import { Lock, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      if (updateError) throw updateError;
      
      setSuccess(true);
      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          navigate("/patient/login", { replace: true });
        });
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Your link might have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#FAFAFA] p-4 overflow-auto font-sans">
      <a href="/" className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-[#8CA397] hover:text-[#0A3622] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </a>

      <div className="w-full max-w-[420px] space-y-6">
        <div className="flex flex-col items-center text-center space-y-6 mb-6">
          <img src="/originallogo.png" alt="Peak Health" className="h-[46px] object-contain" />
          <div className="space-y-1.5">
            <h1 className="text-[32px] text-[#0A3622] font-medium tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Set new password
            </h1>
            <p className="text-[14px] text-[#6A8074]">
              Please enter your new secure password.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Lock className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-[#0A3622]">Password Updated</h2>
              <p className="text-sm text-[#6A8074]">Your password has been successfully reset. Redirecting you to login...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-[14px] text-sm bg-red-50 border border-red-100 text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8CA397]">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-[15px] h-[16px] w-[16px] text-[#A0B3A8]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full rounded-[14px] pl-[42px] pr-10 py-3.5 text-[14px] border border-slate-200 bg-white placeholder:text-[#A0B3A8] focus:outline-none focus:border-[#0A3622] focus:ring-1 focus:ring-[#0A3622]/20 transition-all text-slate-800 font-medium tracking-[0.2em]"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[15px] text-[#A0B3A8] hover:text-[#6A8074] transition-colors">
                    {showPassword ? <EyeOff className="h-[16px] w-[16px]" /> : <Eye className="h-[16px] w-[16px]" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#8CA397]">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-[15px] h-[16px] w-[16px] text-[#A0B3A8]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-[14px] pl-[42px] pr-10 py-3.5 text-[14px] border border-slate-200 bg-white placeholder:text-[#A0B3A8] focus:outline-none focus:border-[#0A3622] focus:ring-1 focus:ring-[#0A3622]/20 transition-all text-slate-800 font-medium tracking-[0.2em]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] rounded-[14px] text-[14px] font-medium text-white transition-all bg-[#0A3622] hover:bg-[#072B1A] disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </span>
                ) : "Save New Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
