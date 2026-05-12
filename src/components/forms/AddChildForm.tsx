import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface AddChildFormProps {
  onSuccess?: () => void;
}

export function AddChildForm({ onSuccess }: AddChildFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    parent_name: "",
    grade: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim() || !formData.parent_name.trim()) {
      toast({
        title: "Error",
        description: "Child name and parent name are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('dzikwa_children')
        .insert({
          full_name: formData.full_name.trim(),
          parent_name: formData.parent_name.trim(),
          grade: formData.grade.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${data.full_name} has been added successfully`,
      });

      // Reset form
      setFormData({ full_name: "", parent_name: "", grade: "" });

      // Call onSuccess callback with created data
      onSuccess?.(data);
    } catch (error) {
      console.error('Error adding child:', error);
      toast({
        title: "Error",
        description: "Failed to add child",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Child Name *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="Enter child's full name"
          required
        />
      </div>
      <div>
        <Label htmlFor="parent_name">Parent Name *</Label>
        <Input
          id="parent_name"
          value={formData.parent_name}
          onChange={(e) => setFormData(prev => ({ ...prev, parent_name: e.target.value }))}
          placeholder="Enter parent's full name"
          required
        />
      </div>
      <div>
        <Label htmlFor="grade">Grade</Label>
        <Input
          id="grade"
          value={formData.grade}
          onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
          placeholder="Enter grade (optional)"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Adding..." : "Add Child"}
        </Button>
      </div>
    </form>
  );
}