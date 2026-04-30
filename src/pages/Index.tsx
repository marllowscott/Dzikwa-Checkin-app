import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { CheckInForm } from "@/components/CheckInForm";
import { useToast } from "@/hooks/use-toast";
import { createCheckIn, createCheckOut, checkInGuest, checkOutGuest, checkInChild, checkOutChild, supabase } from "@/lib/supabase";

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Unified check-in handler for all domains
  const handleCheckIn = async (personId: string, domain: string) => {
    setIsLoading(true);
    try {
      if (domain === 'employee') {
        const { data, error } = await createCheckIn(personId);

        if (error) throw error;

        toast({
          title: "Checked In Successfully!",
          description: `Welcome ${data?.full_name || 'Employee'}. Logged in at ${new Date().toLocaleTimeString()}`,
          variant: "default",
        });
      } else if (domain === 'guest') {
        // Get guest details first
        const { data: guest } = await supabase
          .from('guests')
          .select('full_name')
          .eq('id', personId)
          .single();

        const { data, error } = await checkInGuest(personId, 'Visit');

        if (error) throw error;

        toast({
          title: "Checked In Successfully!",
          description: `Welcome ${guest?.full_name || 'Guest'}. Logged in at ${new Date().toLocaleTimeString()}`,
          variant: "default",
        });
      } else if (domain === 'child') {
        // Get child details first
        const { data: child } = await supabase
          .from('dzikwa_children')
          .select('full_name')
          .eq('id', personId)
          .single();

        const { data, error } = await checkInChild(personId);

        if (error) throw error;

        toast({
          title: "Checked In Successfully!",
          description: `Welcome ${child?.full_name || 'Child'}. Logged in at ${new Date().toLocaleTimeString()}`,
          variant: "default",
        });
      } else if (domain === 'workshop') {
        // Workshop guests use the same logic as regular guests
        // Get guest details first
        const { data: guest } = await supabase
          .from('guests')
          .select('full_name')
          .eq('id', personId)
          .single();

        const { data, error } = await checkInGuest(personId, 'Workshop Check-in');

        if (error) throw error;

        toast({
          title: "Workshop Check-in Successful!",
          description: `Welcome ${guest?.full_name || 'Workshop Guest'}. Logged in at ${new Date().toLocaleTimeString()}`,
          variant: "default",
        });
      }
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

  // Unified check-out handler for all domains
  const handleCheckOut = async (personId: string, domain: string) => {
    setIsLoading(true);
    try {
      if (domain === 'employee') {
        const { data, error } = await createCheckOut(personId);

        if (error) throw error;

        toast({
          title: "Checked Out Successfully!",
          description: `Goodbye ${data?.full_name || 'Employee'}. Logged out at ${new Date().toLocaleTimeString()}`,
          variant: "default",
        });
      } else if (domain === 'guest') {
        // Find the active guest check-in
        const { data: activeCheckIn } = await supabase
          .from('guest_check_ins')
          .select('*, guests!full_name(*)')
          .eq('guest_id', personId)
          .is('check_out_time', null)
          .order('check_in_time', { ascending: false })
          .limit(1)
          .single();

        if (!activeCheckIn) {
          throw new Error('No active check-in found');
        }

        const { data, error } = await checkOutGuest(activeCheckIn.id);

        if (error) throw error;

        toast({
          title: "Checked Out Successfully!",
          description: `Goodbye ${activeCheckIn.guests?.full_name || 'Guest'}. Logged out at ${new Date().toLocaleTimeString()}`,
          variant: "default",
        });
      } else if (domain === 'child') {
        // Find the active child check-in
        const { data: activeCheckIn } = await supabase
          .from('child_check_ins')
          .select('*, dzikwa_children!full_name(*)')
          .eq('child_id', personId)
          .is('check_out_time', null)
          .order('check_in_time', { ascending: false })
          .limit(1)
          .single();

        if (!activeCheckIn) {
          throw new Error('No active check-in found');
        }

        const { data, error } = await checkOutChild(activeCheckIn.id);

        if (error) throw error;

        toast({
          title: "Checked Out Successfully!",
          description: `Goodbye ${activeCheckIn.dzikwa_children?.full_name || 'Child'}. Logged out at ${new Date().toLocaleTimeString()}`,
          variant: "default",
        });
      } else if (domain === 'workshop') {
        // Workshop guests use the same check-out logic as regular guests
        // Find the active guest check-in
        const { data: activeCheckIn } = await supabase
          .from('guest_check_ins')
          .select('*, guests!full_name(*)')
          .eq('guest_id', personId)
          .is('check_out_time', null)
          .order('check_in_time', { ascending: false })
          .limit(1)
          .single();

        if (!activeCheckIn) {
          throw new Error('No active check-in found');
        }

        const { data, error } = await checkOutGuest(activeCheckIn.id);

        if (error) throw error;

        toast({
          title: "Workshop Check-out Successful!",
          description: `Goodbye ${activeCheckIn.guests?.full_name || 'Workshop Guest'}. Logged out at ${new Date().toLocaleTimeString()}`,
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Check-out error:', error);
      toast({
        title: "Check-out Failed",
        description: error.message || "No active check-in found or there was an error processing your check-out.",
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
              View attendance records on{" "}
              <a href="/logs" className="text-primary hover:underline font-medium">
                Logs
              </a>{" "}
              page.
            </p>
            <p className="text-xs text-muted-foreground mt-2 opacity-50">
              Admin access: Double-tap 'A' key
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
