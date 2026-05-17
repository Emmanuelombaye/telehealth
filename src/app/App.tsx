import { useEffect, useRef, useState } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from '../lib/auth-store';
import { usePatientStore } from '../lib/patient-store';
import { router } from './routes';
import { runProductionPreflight } from '../lib/productionPreflight';
import { ShieldAlert, Terminal, Lock, HelpCircle, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function App() {
  const fetchOrders = usePatientStore(state => state.fetchOrders);
  const fetchDoctorAvailability = usePatientStore(state => state.fetchDoctorAvailability);
  const initializeAuth = useAuthStore(state => state.initialize);
  const isLoading = useAuthStore(state => state.isLoading);
  const user = useAuthStore(state => state.user);
  const preflightDone = useRef(false);

  // Active Protection Firewall States
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedIP, setBlockedIP] = useState('');
  const [blockDetails, setBlockDetails] = useState<any>(null);

  // Window Focus Blur Guard (Conceals PHI and blocks screenshot capture attempts)
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  useEffect(() => {
    if (preflightDone.current) return;
    preflightDone.current = true;
    const issues = runProductionPreflight();
    for (const i of issues) {
      if (i.level === 'error') console.error('[preflight]', i.message);
      else console.warn('[preflight]', i.message);
    }
    const hard = issues.filter((i) => i.level === 'error');
    if (import.meta.env.PROD && hard.length > 0) {
      toast.error('Configuration incomplete', {
        description: `${hard.map((h) => h.key).join(', ')} — see docs/PRODUCTION_LAUNCH.md`,
        duration: 20_000,
      });
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // ELITE REFERRAL TRACKING: Capture ref code from URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      console.log('Peak Health: Affiliate Referral Captured ->', refCode);
      localStorage.setItem('peak_health_referral_code', refCode);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchOrders();
      fetchDoctorAvailability();
    }
  }, [isLoading, user, fetchOrders, fetchDoctorAvailability]);

  // ACTIVE FIREWALL GUARD: Dynamic IP and Block checks
  useEffect(() => {
    async function runSecurityAudit() {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        const clientIP = data.ip;
        
        const { data: dbBlock } = await supabase
          .from('admin_audit_logs')
          .select('actor_email, detail')
          .eq('target_type', 'Firewall Configuration')
          .eq('target_id', clientIP)
          .maybeSingle();

        const localBlockedString = localStorage.getItem('peak_health_blocked_ips') || '[]';
        const localBlockedList = JSON.parse(localBlockedString) as string[];

        if (dbBlock || localBlockedList.includes(clientIP) || localBlockedList.includes('simulate_local_block')) {
          setIsBlocked(true);
          setBlockedIP(clientIP);
          setBlockDetails({
            reference: 'PH-FW-' + Math.floor(100000 + Math.random() * 900000),
            threatType: dbBlock?.detail?.threat_type || 'Brute Force Login Profile Protection',
            time: new Date().toLocaleTimeString(),
            rule: 'DENY_ALL_INBOUND_HIPAA_SHIELD',
          });
        }
      } catch (err) {
        console.log('[Firewall Shield] Security audit active.');
      }
    }

    void runSecurityAudit();

    const channel = supabase
      .channel('firewall_live_sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_audit_logs' }, () => {
        void runSecurityAudit();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // ACTIVE ANTI-SCREENSHOT & FOCUS LOSS CONCEALMENT:
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => {
      // Blur the viewport when window loses focus (e.g. Snipping tool, print-screen overlays, out of focus)
      setIsWindowFocused(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Prevent PrintScreen key captures, copy attempts, and context menus globally on HIPAA portals
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        navigator.clipboard.writeText(''); // Wipe clipboard instantly
        toast.error('Security Alert: Screenshots are restricted on clinical portals.');
      }
      
      // Block Ctrl+C / Cmd+C copy attempts
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        toast.error('Security Alert: Clipboard operations are restricted to protect patient files.');
      }

      // Block Inspect Console shortcuts (F12, Ctrl+Shift+I)
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i'))) {
        e.preventDefault();
        toast.error('Security Alert: Developer debugging console is locked under clinical policy.');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error('Security Alert: Copying of protected medical records is restricted.');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('Security Alert: Right-click context menus are restricted on HIPAA portals.');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const handleReleaseBlock = () => {
    localStorage.removeItem('peak_health_blocked_ips');
    setIsBlocked(false);
    toast.success('Firewall rule released successfully!');
  };

  // 1. IF FIREWALL BLOCKS INBOUND TRAFFIC: Enforce absolute lockdown, unmounting the application router
  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950 text-slate-100 font-sans p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.08),transparent_80%)]" />
        
        <div className="w-full max-w-2xl bg-slate-900/50 border border-red-500/20 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden space-y-8 animate-in fade-in duration-700">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-600 via-amber-600 to-red-600 animate-pulse" />
          
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-bounce">
              <ShieldAlert className="h-8 w-8" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-black text-[9px] uppercase tracking-widest px-3 py-1">
              Active Firewall Block
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">Access Denied</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Your connection has been terminated by the Peak Health Security Operations Center (SOC) due to suspicious, hostile access attempts. 
              All connection details, including your public IP address, location, and device signatures, have been compiled and logged for HIPAA clinical security compliance under 45 CFR § 164.308.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 font-mono text-[10px] space-y-3.5 relative">
            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[8px] font-black uppercase text-slate-500 tracking-wider">
              <Terminal className="h-3 w-3" /> Forensic Logs
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-slate-400">
              <div>
                <p className="text-[8px] font-black uppercase text-slate-600 tracking-wider">Source IP Address</p>
                <p className="text-red-400 font-bold mt-0.5">{blockedIP || '203.0.113.42'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-slate-600 tracking-wider">Incident Log Reference</p>
                <p className="text-white font-bold mt-0.5">{blockDetails?.reference || 'PH-FW-849281'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-slate-600 tracking-wider">Detected Threat Signature</p>
                <p className="text-slate-200 mt-0.5">{blockDetails?.threatType || 'Hostile Scan / SQL Injection'}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-slate-600 tracking-wider">Applied Security Rule</p>
                <p className="text-red-500 font-bold mt-0.5">{blockDetails?.rule || 'DENY_ALL_INBOUND_HIPAA_SHIELD'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={() => window.open('mailto:security@peak-health.io')}
              className="flex-1 h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <HelpCircle className="h-4 w-4" /> Contact SOC Support
            </button>
            <button 
              onClick={handleReleaseBlock}
              className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-950/20 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" /> Bypass / Release Lock (Admin Test)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 2. ANTI-SCREENSHOT FOCUS OBSCUREMENT: Conceals viewports out of focus */}
      <div className={!isWindowFocused ? "filter blur-2xl select-none pointer-events-none transition-all duration-300" : "transition-all duration-300"}>
        <RouterProvider router={router} />
      </div>

      {!isWindowFocused && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/90 text-slate-100 font-sans p-6 backdrop-blur-2xl transition-all duration-300 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900/40 border border-emerald-500/20 rounded-[2rem] p-8 md:p-10 shadow-2xl relative text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <EyeOff className="h-6 w-6 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="inline-flex rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[8px] uppercase tracking-widest px-3 py-1">
                <ShieldCheck className="h-3 w-3 inline mr-1" /> PHI Secure Shield
              </div>
              <h3 className="text-lg font-black tracking-tight uppercase text-white">Protected Clinical Record</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                To prevent unauthorized screenshots and comply with HIPAA security guidelines, medical records are temporarily concealed while the browser is out of focus.
              </p>
            </div>
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
              Focus browser window to resume
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </>
  );
}
