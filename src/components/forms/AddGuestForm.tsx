import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface AddGuestFormProps {
  onSuccess?: () => void;
}

export function AddGuestForm({ onSuccess }: AddGuestFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    purpose: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "Guest name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('guests')
        .insert({
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          company: formData.company.trim() || null,
          purpose: formData.purpose.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${data.full_name} has been added as a guest`,
      });

      // Reset form
      setFormData({ full_name: "", email: "", phone: "", company: "", purpose: "" });

      // Call onSuccess callback
      onSuccess?.();
    } catch (error) {
      console.error('Error adding guest:', error);
      toast({
        title: "Error",
        description: "Failed to add guest",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="Enter guest's full name"
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter guest's email (optional)"
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Enter guest's phone number (optional)"
        />
      </div>
      <div>
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          placeholder="Enter guest's company (optional)"
        />
      </div>
      <div>
        <Label htmlFor="purpose">Purpose of Visit</Label>
        <Textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
          placeholder="Enter purpose of visit (optional)"
          rows={3}
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Adding..." : "Add Guest"}
        </Button>
      </div>
    </form>
  );
}