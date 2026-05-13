import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { usePatientStore } from '../lib/patient-store';
import { useAuthStore } from '../lib/auth-store';

export default function App() {
  const fetchOrders = usePatientStore(state => state.fetchOrders);
  const fetchDoctorAvailability = usePatientStore(state => state.fetchDoctorAvailability);
  const initializeAuth = useAuthStore(state => state.initialize);
  const isLoading = useAuthStore(state => state.isLoading);
  const user = useAuthStore(state => state.user);

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
