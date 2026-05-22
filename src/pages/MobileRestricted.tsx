import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, Smartphone, AlertCircle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MobileRestricted() {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is on mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 1024;

      setIsMobile(isMobileDevice || isTablet || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleReturnHome = () => {
    // Navigate away from the app completely
    window.location.href = 'https://www.google.com';
  };

  const handleDesktopRedirect = () => {
    // Redirect to desktop version or show instructions
    window.location.href = window.location.origin;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/3 to-accent flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/30 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-20 w-48 h-48 bg-secondary rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-36 h-36 bg-accent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Main Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl border-0 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-primary p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Smartphone className="w-16 h-16 text-white opacity-50" />
                <div className="absolute -top-2 -right-2">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Desktop Only</h1>
            <p className="text-primary-foreground/80 text-sm">This application requires a desktop computer</p>
          </div>

          {/* Content Section */}
          <div className="p-6 space-y-6">
            {/* Device Comparison */}
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                  <Smartphone className="w-8 h-8 text-red-500" />
                </div>
                <span className="text-xs text-red-600 font-medium">Not Supported</span>
              </div>

              <div className="flex-1 h-px bg-gray-300 mx-2"></div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Monitor className="w-8 h-8 text-green-500" />
                </div>
                <span className="text-xs text-green-600 font-medium">Required</span>
              </div>
            </div>

            {/* Message */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-primary mb-1">Desktop Access Required</h3>
                  <p className="text-sm text-primary/80 leading-relaxed">
                    The Dzikwa Check-in application is designed for desktop computers only.
                    Please switch to a laptop or desktop computer to access all features.
                  </p>
                </div>
              </div>
            </div>

            {/* Why Desktop Section */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 text-sm">Why Desktop Only?</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Full administrative dashboard access</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Comprehensive data management tools</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Optimized for larger screens and keyboards</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Advanced reporting and export features</span>
                </div>
              </div>
            </div>

            {/* Device Info */}
            {isMobile && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Current Device:</span>
                  <Badge variant="destructive" className="text-xs">
                    Mobile/Tablet Detected
                  </Badge>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleReturnHome}
                variant="outline"
                className="w-full flex items-center gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                Return Home
              </Button>

              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full flex items-center gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>

              <Button
                onClick={handleDesktopRedirect}
                className="w-full bg-gradient-primary hover:opacity-90 text-white shadow-button hover:shadow-elevation transition-smooth transform hover:scale-[1.02]"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Continue on Desktop
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Need help? Contact your system administrator
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Dzikwa Check-in System
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Optimized for desktop experience
          </p>
        </div>
      </div>
    </div>
  );
}
