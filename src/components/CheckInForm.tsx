import { useState, useCallback, memo, useEffect, useRef } from "react";
import { ProfessionalButton } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { searchAllDomains, checkPersonStatus } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, AlertCircle, RefreshCw } from "lucide-react";

// Unified person type for all domains
interface Person {
  id: string;
  full_name: string;
  is_active: boolean;
  domain: 'employee' | 'guest' | 'workshop' | 'sadza-stats' | 'children';
  domainLabel: string;
}

interface CheckInFormProps {
  onCheckIn: (personId: string, domain: string) => void;
  onCheckOut: (personId: string, domain: string) => void;
  isLoading?: boolean;
}

export const CheckInForm = memo(({ onCheckIn, onCheckOut, isLoading }: CheckInFormProps) => {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Person[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [personStatus, setPersonStatus] = useState<{ checkedIn: boolean; domain: string; checkInId: string | null } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  // Refs for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  // Check person status when selection changes
  useEffect(() => {
    if (selectedPerson) {
      const checkStatus = async () => {
        try {
          const status = await checkPersonStatus(selectedPerson.id, selectedPerson.domain);
          setPersonStatus(status);
        } catch (error) {
          setPersonStatus(null);
        }
      };
      checkStatus();
    } else {
      setPersonStatus(null);
    }
  }, [selectedPerson]);

  // Actual search function (debounced)
  const performSearch = useCallback(async (query: string) => {
    // Cancel previous search if still running
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    setIsSearching(true);
    setHasSearched(false);

    try {
      const results = await searchAllDomains(query);

      // Filter to only show active people
      const activeResults = (results || []).filter((r: Person) => r.is_active);

      setSuggestions(activeResults as Person[]);
      setShowSuggestions(true);
      setHasSearched(true);
      setSearchError(null);
    } catch (error) {
      // Don't show error if search was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Search error:', error);
      setSuggestions([]);
      setShowSuggestions(true); // Show error state
      setHasSearched(true);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setSearchError('Unable to connect to the server. Please check your internet connection or try again in a moment.');
      } else {
        setSearchError('An error occurred while searching. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchError(null);

    // Handle minimum length check immediately
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set timeout for search only if we have enough characters
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500); // 500ms delay for better typing experience
  }, [performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle person selection
  const handlePersonSelect = useCallback((person: Person) => {
    setSelectedPerson(person);
    setSearchQuery(person.full_name);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchError(null);
    setIsSearching(false);
    setHasSearched(false);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel ongoing search
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSearching(false);
    setSearchError(null);
    setHasSearched(false);
    setSelectedPerson(null);
    setPersonStatus(null);
  }, []);

  // Retry search
  const retrySearch = useCallback(() => {
    if (searchQuery.length >= 2) {
      handleSearch(searchQuery);
    }
  }, [searchQuery, handleSearch]);

  // Handle check-in
  const handleCheckIn = useCallback(() => {
    if (!selectedPerson) {
      toast({
        title: "Error",
        description: "Please select a person from the suggestions",
        variant: "destructive",
      });
      return;
    }

    if (personStatus?.checkedIn) {
      toast({
        title: "Error",
        description: `${selectedPerson.domainLabel} is already checked in`,
        variant: "destructive",
      });
      return;
    }

    onCheckIn(selectedPerson.id, selectedPerson.domain);
    setSelectedPerson(null);
    setSearchQuery("");
    setPersonStatus(null);
  }, [selectedPerson, personStatus, onCheckIn, toast]);

  // Handle check-out
  const handleCheckOut = useCallback(() => {
    if (!selectedPerson) {
      toast({
        title: "Error",
        description: "Please select a person",
        variant: "destructive",
      });
      return;
    }

    if (!personStatus?.checkedIn) {
      toast({
        title: "Error",
        description: `${selectedPerson.domainLabel} is not checked in`,
        variant: "destructive",
      });
      return;
    }

    onCheckOut(selectedPerson.id, selectedPerson.domain);
    setSelectedPerson(null);
    setSearchQuery("");
    setPersonStatus(null);
  }, [selectedPerson, personStatus, onCheckOut, toast]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (personStatus?.checkedIn) {
        handleCheckOut();
      } else {
        handleCheckIn();
      }
    }
  }, [personStatus, handleCheckIn, handleCheckOut]);

  // Get status text
  const getStatusText = () => {
    if (personStatus?.checkedIn) {
      return `Select ${selectedPerson?.domainLabel || 'person'} to check out`;
    }
    return 'Select person to check in';
  };

  // Get domain badge color
  const getDomainBadgeVariant = (domain: string) => {
    switch (domain) {
      case 'employee':
        return 'default';
      case 'guest':
        return 'secondary';
      case 'workshop':
        return 'outline';
      case 'children':
        return 'secondary';
      case 'sadza-stats':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className="w-full max-w-sm sm:max-w-md mx-auto p-4 sm:p-6 lg:p-8 bg-gradient-card shadow-elevation rounded-[7px]">
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Digital Check-In</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2 px-2">
            {getStatusText()}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personSearch" className="text-sm font-medium">
              Name
            </Label>
            <div className="relative">
              <Input
                id="personSearch"
                type="text"
                placeholder="Search employees, guests, workshop participants, children, or sadza recipients..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-10 sm:h-12 text-sm sm:text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                disabled={isLoading || isSearching}
              />

              {/* Results Container - Responsive Height */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-primary rounded-md shadow-lg z-50 transition-all duration-200" style={{ minHeight: '120px', maxHeight: '50vh' }}>
                  <div className="p-3 sm:p-4">
                    {isSearching ? (
                      // Loading State
                      <div className="flex flex-col items-center justify-center h-20">
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary mb-2" />
                        <p className="text-xs sm:text-sm text-muted-foreground">Searching...</p>
                      </div>
                    ) : searchError ? (
                      // Error State
                      <div className="flex flex-col items-center justify-center h-20">
                        <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive mb-2" />
                        <p className="text-xs sm:text-sm text-center text-muted-foreground mb-3">{searchError}</p>
                        <button
                          onClick={retrySearch}
                          className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors min-h-[36px]"
                        >
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                          Try Again
                        </button>
                      </div>
                    ) : hasSearched && suggestions.length === 0 ? (
                      // Empty State
                      <div className="flex flex-col items-center justify-center h-20">
                        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground mb-2" />
                        <p className="text-xs sm:text-sm text-center text-muted-foreground mb-3">
                          No matching name found. Please check your spelling or try a different name.
                        </p>
                        <p className="text-xs text-center text-muted-foreground mb-3">
                          Use the "+" button to add a new person.
                        </p>
                        <button
                          onClick={clearSearch}
                          className="px-3 py-2 text-xs sm:text-sm bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors min-h-[36px]"
                        >
                          Clear Search
                        </button>
                      </div>
                    ) : (
                      // Success State with Results
                      <div className="max-h-32 sm:max-h-48 overflow-y-auto">
                        {suggestions.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => handlePersonSelect(person)}
                            className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-xs sm:text-sm flex items-center justify-between rounded-sm min-h-[44px]"
                          >
                            <span className="truncate pr-2">{person.full_name}</span>
                            <Badge variant={getDomainBadgeVariant(person.domain)} className="ml-2 text-xs flex-shrink-0">
                              {person.domainLabel}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Person Info */}
        {selectedPerson && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Selected:</span>
            <Badge variant={getDomainBadgeVariant(selectedPerson.domain)}>
              {selectedPerson.domainLabel}
            </Badge>
            {personStatus?.checkedIn && (
              <Badge variant="destructive" className="ml-2">
                Checked In
              </Badge>
            )}
          </div>
        )}

        {/* Conditional Button Rendering */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {personStatus?.checkedIn ? (
            <ProfessionalButton
              variant="checkout"
              size="lg"
              onClick={handleCheckOut}
              disabled={isLoading || !selectedPerson}
              className="flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[56px] text-sm sm:text-base"
            >
              Check Out
            </ProfessionalButton>
          ) : (
            <ProfessionalButton
              variant="checkin"
              size="lg"
              onClick={handleCheckIn}
              disabled={isLoading || !selectedPerson}
              className="flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[56px] text-sm sm:text-base"
            >
              Check In
            </ProfessionalButton>
          )}
        </div>
      </div>
    </Card>
  );
});

CheckInForm.displayName = 'CheckInForm';

export default CheckInForm;
