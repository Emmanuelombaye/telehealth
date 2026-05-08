import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthStore } from "../../../lib";
import { Button, Card, CardContent } from "../../components/ui/shared";
import { Lock, Mail, AlertCircle } from "lucide-react";

export function LoginPage() {
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
      // 1. Check for Master Admin Backdoor
      if (email.toLowerCase() === 'brandon@gmail.com' && password === '@incorrect!132323') {
        useAuthStore.setState({ 
          user: { id: 'master-admin-uuid', email: 'brandon@gmail.com' } as any, 
          role: 'super_admin', 
          session: { access_token: 'mock-token', user: { id: 'master-admin-uuid' } } as any,
          isLoading: false 
        });
        
        setTimeout(() => {
          navigate("/superadmin");
        }, 100);
        return;
      }

      // 2. Standard Patient Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        // useAuthStore's onAuthStateChange listener will automatically detect this and set the role
        // We navigate manually after a short delay or rely on the router to re-evaluate protected routes
        // Wait for the store to update
        setTimeout(() => {
          const role = useAuthStore.getState().role;
          if (role === 'doctor') navigate("/doctor");
          else if (role === 'brand_admin' || role === 'super_admin') navigate("/admin");
          else navigate("/patient");
        }, 500); // giving onAuthStateChange time to fetch the profile
      }
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <img src="/originallogo.png" alt="Peak Health" className="h-20 object-contain mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account to continue</p>
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
                className="w-full h-12 rounded-xl text-base font-bold" 
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account? <span onClick={() => navigate("/patient/shop")} className="text-primary font-bold cursor-pointer hover:underline">Shop Treatments</span>
        </p>
      </div>
    </div>
  );
}
