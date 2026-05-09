import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface AddEmployeeFormProps {
  onSuccess?: () => void;
}

export function AddEmployeeForm({ onSuccess }: AddEmployeeFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    department: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "Employee name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          full_name: formData.full_name.trim(),
          email: formData.email.trim() || null,
          department: formData.department.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Add user role
      await supabase
        .from('user_roles')
        .insert({
          user_id: data.id,
          role: 'employee'
        });

      toast({
        title: "Success",
        description: `${data.full_name} has been added successfully`,
      });

      // Reset form
      setFormData({ full_name: "", email: "", department: "" });

      // Call onSuccess callback
      onSuccess?.();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: "Failed to add employee",
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
          placeholder="Enter employee's full name"
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
          placeholder="Enter employee's email (optional)"
        />
      </div>
      <div>
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          value={formData.department}
          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          placeholder="Enter department (optional)"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Adding..." : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}