import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface AddWorkshopGuestFormProps {
  onSuccess?: () => void;
}

export function AddWorkshopGuestForm({ onSuccess }: AddWorkshopGuestFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    workshop_type: "Standard Workshop",
    special_notes: ""
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
        .from('workshop_guests')
        .insert([{
          full_name: formData.full_name.trim(),
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          company: formData.company?.trim() || null,
          workshop_type: formData.workshop_type,
          special_notes: formData.special_notes?.trim() || null,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${data.full_name} has been added as a workshop guest`,
      });

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        company: "",
        workshop_type: "Standard Workshop",
        special_notes: ""
      });

      // Call onSuccess callback
      onSuccess?.();
    } catch (error) {
      console.error('Error adding workshop guest:', error);
      toast({
        title: "Error",
        description: "Failed to add workshop guest",
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
        <Label htmlFor="workshop_type">Workshop Type</Label>
        <Select
          value={formData.workshop_type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, workshop_type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select workshop type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Standard Workshop">Standard Workshop</SelectItem>
            <SelectItem value="Advanced Workshop">Advanced Workshop</SelectItem>
            <SelectItem value="Special Session">Special Session</SelectItem>
            <SelectItem value="Training">Training</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="special_notes">Special Notes</Label>
        <Textarea
          id="special_notes"
          value={formData.special_notes}
          onChange={(e) => setFormData(prev => ({ ...prev, special_notes: e.target.value }))}
          placeholder="Enter any special notes (optional)"
          rows={3}
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Adding..." : "Add Workshop Guest"}
        </Button>
      </div>
    </form>
  );
}