import { useEffect, useState } from 'react';

export interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isSmallScreen: boolean;
  shouldRestrict: boolean;
  userAgent: string;
}

export const useMobileDetection = (): MobileDetectionResult => {
  const [detection, setDetection] = useState<MobileDetectionResult>({
    isMobile: false,
    isTablet: false,
    isSmallScreen: false,
    shouldRestrict: false,
    userAgent: ''
  });

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Mobile device detection
      const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Tablet detection
      const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
      
      // Screen size detection
      const isSmallScreen = window.innerWidth < 1024;
      
      // Determine if access should be restricted
      const shouldRestrict = isMobile || isTablet || isSmallScreen;

      setDetection({
        isMobile,
        isTablet,
        isSmallScreen,
        shouldRestrict,
        userAgent
      });
    };

    // Initial check
    checkDevice();

    // Listen for window resize
    window.addEventListener('resize', checkDevice);
    
    // Listen for orientation change
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return detection;
};

export default useMobileDetection;
