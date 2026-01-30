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
const StoredRecords = lazy(() => import("./pages/StoredRecords"));
const AnimatedLogoShowcase = lazy(() => import("./pages/AnimatedLogoShowcase"));
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

  useEffect(() => {
    // Clear admin session when navigating away from admin dashboard
    if (location.pathname !== "/admin-dashboard") {
      localStorage.removeItem("isAdmin");
    }
  }, [location]);

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
