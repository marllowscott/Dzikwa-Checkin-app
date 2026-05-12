import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, UserPlus, Wrench, Baby, Utensils } from "lucide-react";

interface Domain {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const domains: Domain[] = [
  {
    key: 'employee',
    name: 'Employees',
    description: 'Add a new employee to the system',
    icon: <Users className="h-6 w-6" />
  },
  {
    key: 'guest',
    name: 'Guests',
    description: 'Add a guest visitor',
    icon: <UserPlus className="h-6 w-6" />
  },
  {
    key: 'workshop',
    name: 'Workshops',
    description: 'Add a workshop participant',
    icon: <Wrench className="h-6 w-6" />
  },
  {
    key: 'children',
    name: 'Children',
    description: 'Add a child to the Dzikwa trust',
    icon: <Baby className="h-6 w-6" />
  },
  {
    key: 'sadza-stats',
    name: 'Sadza Recipients',
    description: 'Add a sadza program recipient',
    icon: <Utensils className="h-6 w-6" />
  }
];

interface DomainSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDomain: (domain: string) => void;
}

export function DomainSelectorModal({ open, onOpenChange, onSelectDomain }: DomainSelectorModalProps) {
  const handleSelect = (domainKey: string) => {
    onSelectDomain(domainKey);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[400px] mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg">Add New Person</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
          {domains.map((domain) => (
            <Card
              key={domain.key}
              className="p-3 sm:p-4 hover:bg-muted/50 cursor-pointer transition-colors active:scale-95 min-h-[60px] sm:min-h-[72px]"
              onClick={() => handleSelect(domain.key)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  {domain.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base truncate">{domain.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{domain.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}