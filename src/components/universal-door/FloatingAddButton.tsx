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
        "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110",
        "bg-primary hover:bg-primary/90",
        "flex items-center justify-center",
        "touch-none",
        className
      )}
      size="icon"
    >
      <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
    </Button>
  );
}