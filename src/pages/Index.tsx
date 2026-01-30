import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { CheckInForm } from "@/components/CheckInForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCheckIn = async (fullName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .insert([
          {
            full_name: fullName.trim(),
            check_in_time: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Checked In Successfully!",
        description: `Welcome ${fullName}. Logged in at ${new Date().toLocaleTimeString()}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Check-in Failed",
        description: "There was an error processing your check-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async (fullName: string) => {
    setIsLoading(true);
    try {
      // Find the latest active check-in for this person
      const { data: activeCheckIn, error: fetchError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('full_name', fullName.trim())
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !activeCheckIn) {
        throw new Error('No active check-in found for this person');
      }

      // Update with check-out time
      const { error: updateError } = await supabase
        .from('check_ins')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', activeCheckIn.id);

      if (updateError) throw updateError;

      toast({
        title: "Checked Out Successfully!",
        description: `Goodbye ${fullName}. Logged out at ${new Date().toLocaleTimeString()}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Check-out error:', error);
      toast({
        title: "Check-out Failed",
        description: "No active check-in found or there was an error processing your check-out.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              Dzikwa Check-In System
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl px-4">
              Streamlined attendance tracking for Dzikwa.
              Check in and out with just a few clicks.
            </p>
          </div>

          <CheckInForm
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            isLoading={isLoading}
          />

          <div className="mt-6 sm:mt-8 text-center px-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              View attendance records on the{" "}
              <a href="/dashboard" className="text-primary hover:underline font-medium">
                Dashboard
              </a>{" "}
              or{" "}
              <a href="/logs" className="text-primary hover:underline font-medium">
                Logs
              </a>{" "}
              pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
