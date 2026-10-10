import LeasesPage from "@/pages/landlord/leases/LeasesPage";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import SignUp from "./pages/auth/SignUp";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import TenantOnboarding from "./pages/onboarding/TenantOnboarding";
import LandlordOnboarding from "./pages/onboarding/LandlordOnboarding";
import MainLayout from "./layouts/MainLayout";
import ApplyForm from "./pages/landlord/application/ApplyForm";
import SignLeasePage from "./pages/landlord/application/SignLeasePage";
import ThankYouApplyPage from "./pages/landlord/application/ThankYouApplyPage";
import ThankYouSigningPage from "./pages/landlord/application/ThankYouSigningPage";
import LandingPage from "./pages/LandingPage";
import Documentation from "./pages/Documentation";

const queryClient = new QueryClient();

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/documentation" element={<Documentation />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />

          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          <Route
            path="/leases-invite/sign/:token"
            element={
              <PublicRoute>
                <SignLeasePage />
              </PublicRoute>
            }
          />

          <Route
            path="/apply/thank-you"
            element={
              <ThankYouApplyPage
                landlordEmail={location.state?.landlordEmail || null}
              />
            }
          />

          <Route
            path="/signing/thank-you"
            element={
              <ThankYouSigningPage
                landlordEmail={location.state?.landlordEmail || null}
              />
            }
          />

          <Route
            path="/onboarding/tenant"
            element={
              <ProtectedRoute allowedRoles={["TENANT"]}>
                <TenantOnboarding />
              </ProtectedRoute>
            }
          />

          <Route
            path="/onboarding/landlord"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <LandlordOnboarding />
              </ProtectedRoute>
            }
          />

          <Route path="/apply/:publicId" element={<ApplyForm />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;