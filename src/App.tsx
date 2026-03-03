import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import Index from "./pages/Index";

// Lazy load heavy pages
const Logs = lazy(() => import("./pages/Logs"));
const CheckInTest = lazy(() => import("./pages/CheckInTest"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const GuestSignUp = lazy(() => import("./pages/GuestSignUp"));
const StoredRecords = lazy(() => import("./pages/StoredRecords"));
const AnimatedLogoShowcase = lazy(() => import("./pages/AnimatedLogoShowcase"));
const WorkshopPage = lazy(() => import("./pages/WorkshopPage"));
const GuestDashboard = lazy(() => import("./pages/GuestDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Route guard component for admin routes
const AdminRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  console.log('🛡️ AdminRouteGuard check:', {
    pathname: location.pathname,
    isAdmin: isAdmin,
    shouldRedirect: location.pathname === '/admin-dashboard' && !isAdmin
  });

  // Only allow access to admin-dashboard if authenticated
  if (location.pathname === '/admin-dashboard' && !isAdmin) {
    console.log('🚫 Redirecting to login - not authenticated');
    return <Navigate to="/admin-login" replace />;
  }

  console.log('✅ AdminRouteGuard allowing access');
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AdminRouteGuard>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Navigate to="/admin-login" replace />} />
            <Route path="/logs" element={
              <Suspense fallback={<PageLoader />}>
                <Logs />
              </Suspense>
            } />
            <Route path="/checkin-test" element={
              <Suspense fallback={<PageLoader />}>
                <CheckInTest />
              </Suspense>
            } />
            <Route path="/admin-login" element={
              <Suspense fallback={<PageLoader />}>
                <AdminLogin />
              </Suspense>
            } />
            <Route path="/guest-signup" element={
              <Suspense fallback={<PageLoader />}>
                <GuestSignUp />
              </Suspense>
            } />
            <Route path="/admin-dashboard" element={
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            } />
            <Route path="/stored-records" element={
              <Suspense fallback={<PageLoader />}>
                <StoredRecords />
              </Suspense>
            } />
            <Route path="/animated-logo" element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedLogoShowcase />
              </Suspense>
            } />
            <Route path="/workshop" element={
              <Suspense fallback={<PageLoader />}>
                <WorkshopPage />
              </Suspense>
            } />
            <Route path="/guest-dashboard" element={
              <Suspense fallback={<PageLoader />}>
                <GuestDashboard />
              </Suspense>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={
              <Suspense fallback={<PageLoader />}>
                <NotFound />
              </Suspense>
            } />
          </Routes>
        </AdminRouteGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;


