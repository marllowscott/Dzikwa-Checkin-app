import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Monitor, Smartphone, Tablet, Home, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MobileDetectorProps {
  children: React.ReactNode;
}

export function MobileDetector({ children }: MobileDetectorProps) {
  const navigate = useNavigate();
  const { shouldRestrict, isMobile, isTablet, isSmallScreen } = useMobileDetection();
  const [showModal, setShowModal] = useState(false);
  const [deviceType, setDeviceType] = useState('');

  useEffect(() => {
    // Only redirect if we're not already on the mobile restricted page
    const currentPath = window.location.pathname;
    const isOnMobilePage = currentPath === '/mobile-restricted';

    if (shouldRestrict && !isOnMobilePage) {
      // Determine device type for modal
      let type = 'mobile device';
      if (isTablet) type = 'tablet';
      else if (isSmallScreen) type = 'small screen';

      setDeviceType(type);
      setShowModal(true);
    }
  }, [shouldRestrict, isMobile, isTablet, isSmallScreen]);

  const handleReturnHome = () => {
    window.location.href = 'https://www.google.com'; // Or any appropriate home page
  };

  const handleContinueToRestricted = () => {
    setShowModal(false);
    navigate('/mobile-restricted', { replace: true });
  };

  // If mobile access should be restricted, show modal instead of children
  if (shouldRestrict) {
    return (
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md mx-auto border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-lg"></div>
          <DialogHeader className="text-center relative z-10">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Desktop Access Required
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Device Status */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  {isMobile && <Smartphone className="w-5 h-5 text-primary" />}
                  {isTablet && <Tablet className="w-5 h-5 text-primary" />}
                  {isSmallScreen && <Monitor className="w-5 h-5 text-primary" />}
                  <span className="text-sm font-medium text-primary">
                    {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} detected
                  </span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Not Supported
                </Badge>
              </div>
            </div>

            {/* Message */}
            <div className="text-center space-y-3">
              <p className="text-gray-700 leading-relaxed">
                The Dzikwa Check-in application is designed exclusively for desktop computers.
              </p>
              <p className="text-sm text-gray-600">
                Please switch to a laptop or desktop computer to access all features.
              </p>
            </div>

            {/* Why Desktop */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Why Desktop Only?</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Full administrative dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Advanced data management</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Optimized for larger screens</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleReturnHome}
                variant="outline"
                className="w-full flex items-center gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                Return Home
              </Button>

              <Button
                onClick={handleContinueToRestricted}
                className="w-full bg-gradient-primary hover:opacity-90 text-white shadow-button hover:shadow-elevation transition-smooth transform hover:scale-[1.02]"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Continue to Desktop Info
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Need help? Contact your system administrator
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}

export default MobileDetector;
