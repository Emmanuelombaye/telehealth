import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "./ui/shared.tsx";

interface LogoutConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmation({ isOpen, onClose, onConfirm }: LogoutConfirmationProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A0D14]/60 backdrop-blur-md"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[400px] bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden border border-slate-100"
          >
            {/* Top Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
            
            <div className="p-10 relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <LogOut className="h-7 w-7 text-red-600" />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 mb-10">
                <h3 className="text-2xl font-black text-[#0A2E1F] tracking-tight">Confirm Logout</h3>
                <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                  Are you sure you want to end your current session? You will need to re-authenticate to access your clinical dashboard.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={onConfirm}
                  className="h-14 w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-red-600/20"
                >
                  Confirm Sign Out
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  className="h-14 w-full rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                >
                  Stay Logged In
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-3">
                 <ShieldAlert className="h-4 w-4 text-emerald-600 opacity-30" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Peak Health Secure Termination</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
