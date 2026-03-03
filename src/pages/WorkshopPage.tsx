import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createGuest, checkInGuest, getActiveGuestCheckIns } from "@/lib/supabase";

export default function WorkshopPage() {
  const [activeTab, setActiveTab] = useState("esteemed");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Esteemed Guest Form State
  const [esteemedForm, setEsteemedForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    organization: "",
    special_requirements: "",
    guest_type: "esteemed"
  });

  // Common Guest Form State
  const [commonForm, setCommonForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    guest_type: "common"
  });

  const handleInputChange = (formType: string, field: string, value: string) => {
    if (formType === "esteemed") {
      setEsteemedForm(prev => ({ ...prev, [field]: value }));
    } else {
      setCommonForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (formType: string) => {
    const formData = formType === "esteemed" ? esteemedForm : commonForm;
    
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
      const guest = await createGuest({
        full_name: formData.full_name,
        email: formType === "esteemed" ? formData.email : (formData.email || undefined),
        phone: formType === "esteemed" ? formData.phone : (formData.phone || undefined),
        company: formType === "esteemed" ? formData.organization : undefined,
        purpose: formType === "esteemed" ? `Esteemed Guest - ${formData.special_requirements || 'Visit'}` : 'Workshop Guest',
      });
      
      // Automatically check in the guest
      await checkInGuest(guest.id, formType === "esteemed" ? `Esteemed Guest Visit` : 'Workshop Guest');
      
      toast({
        title: formType === "esteemed" ? "Welcome, Esteemed Guest!" : "Welcome!",
        description: `${guest.full_name} has been checked in successfully.`,
        variant: formType === "esteemed" ? "default" : "default",
      });
      
      // Reset form
      if (formType === "esteemed") {
        setEsteemedForm({
          full_name: "",
          email: "",
          phone: "",
          organization: "",
          special_requirements: "",
          guest_type: "esteemed"
        });
      } else {
        setCommonForm({
          full_name: "",
          email: "",
          phone: "",
          guest_type: "common"
        });
      }
      
    } catch (error) {
      console.error("Error checking in guest:", error);
      toast({
        title: "Check-In Failed",
        description: "Failed to check in guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[7px] flex items-center justify-center mb-4 shadow-elevation">
            <span className="text-3xl sm:text-4xl font-bold text-white">🎓</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Workshop Guest Check-In</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Please select your guest type below
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger 
              value="esteemed" 
              className="text-sm sm:text-base py-3 data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              <span className="mr-2">👑</span>
              Esteemed Guests
            </TabsTrigger>
            <TabsTrigger 
              value="common"
              className="text-sm sm:text-base py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <span className="mr-2">👥</span>
              Common Guests
            </TabsTrigger>
          </TabsList>

          {/* Esteemed Guest Tab */}
          <TabsContent value="esteemed">
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 p-4 sm:p-6 lg:p-8 rounded-[7px]">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-amber-500 text-white text-sm px-3 py-1">
                  VIP
                </Badge>
                <h3 className="text-lg sm:text-xl font-semibold text-amber-800">
                  Esteemed Guest Registration
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="esteemed-full_name" className="text-amber-900 font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="esteemed-full_name"
                    type="text"
                    placeholder="Enter your full name"
                    value={esteemedForm.full_name}
                    onChange={(e) => handleInputChange("esteemed", "full_name", e.target.value)}
                    className="h-10 sm:h-12 border-amber-300 focus:ring-amber-500 bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="esteemed-email" className="text-amber-900 font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="esteemed-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={esteemedForm.email}
                    onChange={(e) => handleInputChange("esteemed", "email", e.target.value)}
                    className="h-10 sm:h-12 border-amber-300 focus:ring-amber-500 bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="esteemed-phone" className="text-amber-900 font-medium">
                    Phone Number *
                  </Label>
                  <Input
                    id="esteemed-phone"
                    type="tel"
                    placeholder="+263 123 4567"
                    value={esteemedForm.phone}
                    onChange={(e) => handleInputChange("esteemed", "phone", e.target.value)}
                    className="h-10 sm:h-12 border-amber-300 focus:ring-amber-500 bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="esteemed-organization" className="text-amber-900 font-medium">
                    Organization/Company
                  </Label>
                  <Input
                    id="esteemed-organization"
                    type="text"
                    placeholder="Company or organization name"
                    value={esteemedForm.organization}
                    onChange={(e) => handleInputChange("esteemed", "organization", e.target.value)}
                    className="h-10 sm:h-12 border-amber-300 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="esteemed-requirements" className="text-amber-900 font-medium">
                    Special Requirements / Notes
                  </Label>
                  <Textarea
                    id="esteemed-requirements"
                    placeholder="Any special requirements, dietary restrictions, accessibility needs, etc."
                    value={esteemedForm.special_requirements}
                    onChange={(e) => handleInputChange("esteemed", "special_requirements", e.target.value)}
                    className="min-h-[80px] border-amber-300 focus:ring-amber-500 bg-white resize-none"
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSubmit("esteemed")}
                className="w-full mt-6 h-12 sm:h-14 text-sm sm:text-lg font-medium bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-elevation transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Check In Esteemed Guest"}
              </Button>
            </Card>
          </TabsContent>

          {/* Common Guest Tab */}
          <TabsContent value="common">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 p-4 sm:p-6 lg:p-8 rounded-[7px]">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                  Workshop
                </Badge>
                <h3 className="text-lg sm:text-xl font-semibold text-blue-800">
                  Workshop Guest Check-In
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="common-full_name" className="text-blue-900 font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="common-full_name"
                    type="text"
                    placeholder="Enter your full name"
                    value={commonForm.full_name}
                    onChange={(e) => handleInputChange("common", "full_name", e.target.value)}
                    className="h-10 sm:h-12 border-blue-300 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="common-email" className="text-blue-900 font-medium">
                    Email Address (Optional)
                  </Label>
                  <Input
                    id="common-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={commonForm.email}
                    onChange={(e) => handleInputChange("common", "email", e.target.value)}
                    className="h-10 sm:h-12 border-blue-300 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="common-phone" className="text-blue-900 font-medium">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="common-phone"
                    type="tel"
                    placeholder="+263 123 4567"
                    value={commonForm.phone}
                    onChange={(e) => handleInputChange("common", "phone", e.target.value)}
                    className="h-10 sm:h-12 border-blue-300 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSubmit("common")}
                className="w-full mt-6 h-12 sm:h-14 text-sm sm:text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-elevation transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Quick Check In"}
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Need help? 
            <a href="/admin-login" className="text-primary hover:underline ml-1">
              Contact Staff
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
