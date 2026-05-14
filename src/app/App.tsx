import { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster, toast } from 'sonner';
import { usePatientStore } from '../lib/patient-store';
import { useAuthStore } from '../lib/auth-store';
import { runProductionPreflight } from '../lib/productionPreflight';

export default function App() {
  const fetchOrders = usePatientStore(state => state.fetchOrders);
  const fetchDoctorAvailability = usePatientStore(state => state.fetchDoctorAvailability);
  const initializeAuth = useAuthStore(state => state.initialize);
  const isLoading = useAuthStore(state => state.isLoading);
  const user = useAuthStore(state => state.user);
  const preflightDone = useRef(false);

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

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}
