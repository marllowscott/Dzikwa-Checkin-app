import { useState, useCallback, memo } from "react";
import { ProfessionalButton } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface CheckInFormProps {
  onCheckIn: (fullName: string) => void;
  onCheckOut: (fullName: string) => void;
  isLoading?: boolean;
}

export const CheckInForm = memo(({ onCheckIn, onCheckOut, isLoading }: CheckInFormProps) => {
  const [fullName, setFullName] = useState("");
  const { toast } = useToast();

  const handleCheckIn = useCallback(() => {
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }
    onCheckIn(fullName.trim());
    setFullName("");
  }, [fullName, onCheckIn, toast]);

  const handleCheckOut = useCallback(() => {
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }
    onCheckOut(fullName.trim());
    setFullName("");
  }, [fullName, onCheckOut, toast]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheckIn();
    }
  }, [handleCheckIn]);

  return (
    <Card className="w-full max-w-sm sm:max-w-md mx-auto p-4 sm:p-6 lg:p-8 bg-gradient-card shadow-elevation rounded-[7px]">
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Digital Check-In</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2 px-2">Enter your details to check in or out</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 sm:h-12 text-sm sm:text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <ProfessionalButton
            variant="checkin"
            size="lg"
            onClick={handleCheckIn}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[56px] text-sm sm:text-base"
          >
            Check In
          </ProfessionalButton>

          <ProfessionalButton
            variant="checkout"
            size="lg"
            onClick={handleCheckOut}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[56px] text-sm sm:text-base"
          >
            Check Out
          </ProfessionalButton>
        </div>
      </div>
    </Card>
  );
});

CheckInForm.displayName = 'CheckInForm';