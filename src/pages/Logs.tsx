import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { ProfessionalButton } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, Calendar, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, CheckInRecord } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type FilterType = "today" | "week" | "month" | "all";

export default function Logs() {
  const [filter, setFilter] = useState<FilterType>("today");
  const [data, setData] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const filterOptions = [
    { key: "today" as const, label: "Today", icon: Calendar },
    { key: "week" as const, label: "This Week", icon: Calendar },
    { key: "month" as const, label: "This Month", icon: Calendar },
    { key: "all" as const, label: "All Records", icon: Users },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: records, error } = await supabase
        .from('check_ins')
        .select('*')
        .order('check_in_time', { ascending: false });

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === 'PGRST116' || error.code === 'PGRST205') {
          toast({
            title: "Database Setup Required",
            description: "Please run the SQL schema in your Supabase dashboard to create the check_ins table.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        setData([]);
      } else {
        setData(records || []);
      }
    } catch (error: any) {
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
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return data.filter(record => {
      const recordDate = new Date(record.check_in_time);

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
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const exportToCSV = () => {
    const headers = ["User Name", "Check-in Time", "Check-out Time", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(record => [
        record.full_name,
        formatDateTime(record.check_in_time),
        record.check_out_time ? formatDateTime(record.check_out_time) : "Still checked in",
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
                      <TableHead className="font-semibold">Time In</TableHead>
                      <TableHead className="font-semibold">Time Out</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Loading records...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
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
                          <TableCell className="font-medium">{record.full_name}</TableCell>
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