import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createGuest, checkInGuest } from "@/lib/supabase";

export default function GuestSignUp() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    purpose: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create guest profile
      const guest = await createGuest(formData);

      // Automatically check in the guest
      await checkInGuest(guest.id, formData.purpose || 'Visit');

      toast({
        title: "Welcome!",
        description: `${guest.full_name} has been registered and checked in successfully.`,
      });

      // Navigate to main check-in page
      navigate("/");

    } catch (error) {
      console.error("Error creating guest:", error);
      toast({
        title: "Registration Failed",
        description: "Failed to register guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">

      <Card className="w-full max-w-md sm:max-w-lg p-4 sm:p-6 lg:p-8 bg-gradient-card shadow-elevation rounded-[7px]">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-[7px] flex items-center justify-center mb-3 sm:mb-4 shadow-button">
            <span className="text-2xl sm:text-3xl font-bold text-primary">👥</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Guest Sign-Up</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Register your details for easy check-in next time you visit
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              className="h-10 sm:h-12 text-sm sm:text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="h-10 sm:h-12 text-sm sm:text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+263 123 4567"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="h-10 sm:h-12 text-sm sm:text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium">
              Company/Organization
            </Label>
            <Input
              id="company"
              type="text"
              placeholder="Company name (optional)"
              value={formData.company}
              onChange={(e) => handleInputChange("company", e.target.value)}
              className="h-10 sm:h-12 text-sm sm:text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-sm font-medium">
              Visit Purpose
            </Label>
            <Input
              id="purpose"
              type="text"
              placeholder="Business meeting, visit, etc."
              value={formData.purpose}
              onChange={(e) => handleInputChange("purpose", e.target.value)}
              className="h-10 sm:h-12 text-sm sm:text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 sm:h-12 text-sm sm:text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Register & Check In"}
          </Button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs text-muted-foreground opacity-50">
            Admin access: Double-tap 'A' key
          </p>
        </div>
      </Card>
    </div>
  );
}
