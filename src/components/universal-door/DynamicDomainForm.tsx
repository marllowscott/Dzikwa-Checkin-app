import { useState } from "react";
import { AddEmployeeForm } from "@/components/forms/AddEmployeeForm";
import { AddGuestForm } from "@/components/forms/AddGuestForm";
import { AddWorkshopGuestForm } from "@/components/forms/AddWorkshopGuestForm";
import { AddChildForm } from "@/components/forms/AddChildForm";
import { AddSadzaRecipientForm } from "@/components/forms/AddSadzaRecipientForm";
import { createCheckIn, checkInGuest, checkInChild, checkInWorkshop } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface DynamicDomainFormProps {
  selectedDomain: string;
  onClose: () => void;
}

export function DynamicDomainForm({ selectedDomain, onClose }: DynamicDomainFormProps) {
  const [isProcessingCheckIn, setIsProcessingCheckIn] = useState(false);
  const { toast } = useToast();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSuccess = async (data: any) => {
    // After successful add, automatically check them in
    setIsProcessingCheckIn(true);

    try {
      switch (selectedDomain) {
        case 'employee':
          await createCheckIn(data.id);
          toast({
            title: "Success",
            description: `${data.full_name} has been added and checked in`,
          });
          break;

        case 'guest':
          await checkInGuest(data.id);
          toast({
            title: "Success",
            description: `${data.full_name} has been added and checked in`,
          });
          break;

        case 'workshop':
          await checkInWorkshop(data.id);
          toast({
            title: "Success",
            description: `${data.full_name} has been added and checked in`,
          });
          break;

        case 'children':
          await checkInChild(data.id);
          toast({
            title: "Success",
            description: `${data.full_name} has been added and checked in`,
          });
          break;

        case 'sadza-stats':
          // Sadza recipients don't have check-ins
          toast({
            title: "Success",
            description: `${data.full_name} has been added successfully`,
          });
          break;

        default:
          toast({
            title: "Success",
            description: "Person added successfully",
          });
      }

      onClose();
    } catch (error) {
      console.error('Error during check-in:', error);
      toast({
        title: "Warning",
        description: "Person added but check-in failed. Please check them in manually.",
        variant: "destructive",
      });
      onClose();
    } finally {
      setIsProcessingCheckIn(false);
    }
  };

  const renderForm = () => {
    const commonProps = {
      onSuccess: handleSuccess
    };

    switch (selectedDomain) {
      case 'employee':
        return <AddEmployeeForm {...commonProps} />;
      case 'guest':
        return <AddGuestForm {...commonProps} />;
      case 'workshop':
        return <AddWorkshopGuestForm {...commonProps} />;
      case 'children':
        return <AddChildForm {...commonProps} />;
      case 'sadza-stats':
        return <AddSadzaRecipientForm {...commonProps} />;
      default:
        return <div>Unknown domain</div>;
    }
  };

  return (
    <div className="space-y-4">
      {renderForm()}
      {isProcessingCheckIn && (
        <div className="text-center text-sm text-muted-foreground">
          Processing check-in...
        </div>
      )}
    </div>
  );
}