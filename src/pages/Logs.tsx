import { useState, useEffect, useMemo, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { ProfessionalButton } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, Calendar, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, CheckInRecord, GuestCheckInWithGuest, WorkshopCheckInWithGuest } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type FilterType = "today" | "week" | "month" | "all";
type DomainType = "employees" | "guests" | "children" | "workshop";

export default function Logs() {
  const [filter, setFilter] = useState<FilterType>("today");
  const [domain, setDomain] = useState<DomainType>("employees");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const domainOptions = [
    { key: "employees" as const, label: "Employees", icon: Users },
    { key: "guests" as const, label: "Guests", icon: Users },
    { key: "children" as const, label: "Children", icon: Users },
    { key: "workshop" as const, label: "Workshop", icon: Users },
  ];

  const filterOptions = [
    { key: "today" as const, label: "Today", icon: Calendar },
    { key: "week" as const, label: "This Week", icon: Calendar },
    { key: "month" as const, label: "This Month", icon: Calendar },
    { key: "all" as const, label: "All Records", icon: Users },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      let records = [];
      let error = null;

      // Fetch data based on selected domain
      switch (domain) {
        case 'employees': {
          const employeeResult = await supabase
            .from('check_ins')
            .select('*')
            .order('check_in_time', { ascending: false });
          records = employeeResult.data || [];
          error = employeeResult.error;
          break;
        }

        case 'guests': {
          const guestResult = await supabase
            .from('guest_check_ins')
            .select(`
              *,
              guests (full_name, email, phone, company)
            `)
            .order('check_in_time', { ascending: false });
          records = guestResult.data || [];
          error = guestResult.error;
          break;
        }

        case 'children': {
          const childResult = await supabase
            .from('child_check_ins')
            .select('*')
            .order('check_in_time', { ascending: false });
          records = childResult.data || [];
          error = childResult.error;
          break;
        }

        case 'workshop': {
          const workshopResult = await supabase
            .from('workshop_check_ins')
            .select(`
              *,
              workshop_guests (full_name, email, company, workshop_type)
            `)
            .order('check_in_time', { ascending: false });
          records = workshopResult.data || [];
          error = workshopResult.error;
          break;
        }

        default: {
          const defaultResult = await supabase
            .from('check_ins')
            .select('*')
            .order('check_in_time', { ascending: false });
          records = defaultResult.data || [];
          error = defaultResult.error;
        }
      }

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === 'PGRST116' || error.code === 'PGRST205') {
          toast({
            title: "Database Setup Required",
            description: `Please run the SQL schema in your Supabase dashboard to create the ${domain} table.`,
            variant: "destructive",
          });
        } else {
          throw error;
        }
        setData([]);
      } else {
        setData(records);
      }
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load check-in records. Please check your database connection.",
        variant: "destructive",
      });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [toast, domain]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return data.filter(record => {
      const recordDate = new Date(record.check_in_time);

      // Skip records with invalid dates
      if (isNaN(recordDate.getTime())) {
        return false;
      }

      switch (filter) {
        case "today":
          return recordDate >= today;
        case "week":
          return recordDate >= weekAgo;
        case "month":
          return recordDate >= monthAgo;
        case "all":
        default:
          return true;
      }
    });
  }, [data, filter]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Time' : date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid' : date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const exportToCSV = () => {
    const headers = ["User Name", "Day of Week", "Check-in Time", "Check-out Time", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(record => [
        domain === 'workshop'
          ? (record as WorkshopCheckInWithGuest).workshop_guests?.full_name || 'Unknown'
          : domain === 'guests'
            ? (record as GuestCheckInWithGuest).guests?.full_name || record.full_name || 'Unknown'
            : record.full_name || 'Unknown',
        getDayOfWeek(record.check_in_time),
        formatTime(record.check_in_time),
        record.check_out_time ? formatTime(record.check_out_time) : "-",
        record.check_out_time ? "Checked Out" : "Active"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkin-logs-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Check-In Logs</h1>
              <p className="text-muted-foreground mt-1">
                View and export attendance records
              </p>
            </div>

            <button
              onClick={exportToCSV}
              className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-primary text-primary-foreground rounded-[7px] shadow-elevation hover:shadow-card hover:scale-110 transition-all duration-200 flex items-center justify-center z-40"
              title="Export CSV"
            >
              <Download className="w-6 h-6 text-primary-foreground" />
            </button>
          </div>

          {/* Domain Selector */}
          <Card className="p-6 bg-gradient-card shadow-card rounded-[7px]">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Select Domain</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {domainOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    onClick={() => setDomain(option.key)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-[7px] text-sm font-medium transition-all duration-200 hover:scale-105",
                      domain === option.key
                        ? "bg-primary text-primary-foreground shadow-button"
                        : "bg-secondary text-secondary-foreground hover:bg-accent hover:shadow-card"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Filters */}
          <Card className="p-6 bg-gradient-card shadow-card rounded-[7px]">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Filter Records</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    onClick={() => setFilter(option.key)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-[7px] text-sm font-medium transition-all duration-200 hover:scale-105",
                      filter === option.key
                        ? "bg-primary text-primary-foreground shadow-button"
                        : "bg-secondary text-secondary-foreground hover:bg-accent hover:shadow-card"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Data Table */}
          <Card className="shadow-elevation rounded-[7px]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Records ({filteredData.length})
                </h2>
                <Badge variant="secondary" className="text-sm">
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-[7px] border border-primary">
                <Table>
                  <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="font-semibold">Full Name</TableHead>
                      <TableHead className="font-semibold">Day</TableHead>
                      <TableHead className="font-semibold">Time In</TableHead>
                      <TableHead className="font-semibold">Time Out</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Loading records...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            No records found
                          </h3>
                          <p className="text-muted-foreground">
                            No check-in records match the selected filter.
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((record, index) => (
                        <TableRow
                          key={record.id}
                          className={cn(
                            "hover:bg-accent/50 transition-colors duration-200",
                            index % 2 === 0 ? "bg-card" : "bg-muted/20"
                          )}
                        >
                           <TableCell className="font-medium">
                             {domain === 'workshop'
                               ? (record as WorkshopCheckInWithGuest).workshop_guests?.full_name || 'Unknown'
                               : domain === 'guests'
                                 ? (record as GuestCheckInWithGuest).guests?.full_name || record.full_name || 'Unknown'
                                 : record.full_name || 'Unknown'
                             }
                           </TableCell>
                          <TableCell className="font-medium text-primary">{getDayOfWeek(record.check_in_time)}</TableCell>
                          <TableCell>{formatTime(record.check_in_time)}</TableCell>
                          <TableCell>
                            {record.check_out_time ? formatTime(record.check_out_time) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={record.check_out_time ? "default" : "secondary"}
                              className={cn(
                                record.check_out_time
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              )}
                            >
                              {record.check_out_time ? "Checked Out" : "Active"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}