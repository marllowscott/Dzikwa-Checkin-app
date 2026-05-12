import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createSadzaRecipient } from "@/lib/supabase";

interface AddSadzaRecipientFormProps {
  onSuccess?: () => void;
}

export function AddSadzaRecipientForm({ onSuccess }: AddSadzaRecipientFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    is_dzikwa_child: false,
    school_name: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "Recipient name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await createSadzaRecipient(formData);

      toast({
        title: "Success",
        description: "Recipient added successfully",
      });

      // Reset form
      setFormData({
        full_name: "",
        phone: "",
        email: "",
        is_dzikwa_child: false,
        school_name: ""
      });

      // Call onSuccess callback with created data
      onSuccess?.(data);
    } catch (error) {
      console.error('Error adding recipient:', error);
      toast({
        title: "Error",
        description: "Failed to add recipient",
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
          placeholder="Enter recipient's full name"
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Enter phone number (optional)"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email address (optional)"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_dzikwa_child"
          checked={formData.is_dzikwa_child}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_dzikwa_child: checked as boolean }))}
        />
        <Label htmlFor="is_dzikwa_child">Is Dzikwa Child</Label>
      </div>
      <div>
        <Label htmlFor="school_name">School Name</Label>
        <Input
          id="school_name"
          value={formData.school_name}
          onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
          placeholder="Enter school name (optional)"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Adding..." : "Add Recipient"}
        </Button>
      </div>
    </form>
  );
}