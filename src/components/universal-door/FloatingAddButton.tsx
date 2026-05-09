import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingAddButtonProps {
  onClick: () => void;
  className?: string;
}

export function FloatingAddButton({ onClick, className }: FloatingAddButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110",
        "bg-primary hover:bg-primary/90",
        "flex items-center justify-center",
        "md:bottom-8 md:right-8",
        className
      )}
      size="icon"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}