import { useMobileDetection } from '@/hooks/useMobileDetection';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Smartphone, Monitor, Tablet } from 'lucide-react';

export function MobileTest() {
  const { isMobile, isTablet, isSmallScreen, shouldRestrict, userAgent } = useMobileDetection();

  return (
    <Card className="p-4 max-w-md mx-auto">
      <h3 className="font-semibold mb-4">Mobile Detection Test</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Mobile Device:</span>
          <Badge variant={isMobile ? "destructive" : "default"}>
            {isMobile ? "Yes" : "No"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Tablet:</span>
          <Badge variant={isTablet ? "destructive" : "default"}>
            {isTablet ? "Yes" : "No"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Small Screen:</span>
          <Badge variant={isSmallScreen ? "destructive" : "default"}>
            {isSmallScreen ? "Yes" : "No"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Should Restrict:</span>
          <Badge variant={shouldRestrict ? "destructive" : "default"}>
            {shouldRestrict ? "Yes" : "No"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 pt-2 border-t">
          {shouldRestrict ? (
            <>
              <Smartphone className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600">Mobile access restricted</span>
            </>
          ) : (
            <>
              <Monitor className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600">Desktop access allowed</span>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
        <strong>User Agent:</strong>
        <div className="break-all mt-1">
          {userAgent.substring(0, 100)}...
        </div>
      </div>
    </Card>
  );
}

export default MobileTest;
