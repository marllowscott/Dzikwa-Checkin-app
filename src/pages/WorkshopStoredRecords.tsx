import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Archive, FileText, Download, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface WorkshopLog {
  id: string;
  date: string;
  month: string;
  saved_at: string;
  total_records: number;
  log_data: any[];
  summary_content: string;
}

export default function WorkshopStoredRecords() {
  const [savedLogs, setSavedLogs] = useState<WorkshopLog[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedDayRecords, setSelectedDayRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(8); // Show 8 records per page for workshop logs

  // Load saved workshop logs
  useEffect(() => {
    loadSavedLogs();
  }, []);

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [savedLogs]);

  const loadSavedLogs = async () => {
    try {
      setIsLoading(true);
      const { data: logs, error } = await supabase
        .from('workshop_check_ins')
        .select('*')
        .eq('saved', true)
        .order('saved_date', { ascending: false });

      if (error) {
        console.error('Error loading workshop saved logs:', error);
        toast({
          title: "Error",
          description: `Failed to load stored records: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Successfully loaded workshop saved logs:', logs?.length || 0, 'records');
      setSavedLogs(logs || []);
    } catch (error: any) {
      console.error('💥 Unexpected error loading workshop saved logs:', error);
      toast({
        title: "Error",
        description: `Failed to load stored records: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate monthly data
  const monthlyData = savedLogs.reduce((acc: any, log) => {
    const year = log.month && log.month.includes('-') ? log.month.split('-')[0] : 'Invalid';
    const key = `${year}-${log.month}`;
    if (!acc[key]) {
      const monthDate = log.month && !isNaN(new Date(log.month + '-01').getTime())
        ? new Date(log.month + '-01').toLocaleDateString('en-US', { month: 'long' })
        : 'Invalid Month';
      acc[key] = {
        month: monthDate,
        year: !isNaN(parseInt(year)) ? parseInt(year) : 0,
        logs: []
      };
    }
    acc[key].logs.push(log);
    return acc;
  }, {});

  const sortedMonthlyData = Object.values(monthlyData).sort((a: any, b: any) => {
    if (a.year !== b.year) return b.year - a.year;
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedMonthlyData.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = sortedMonthlyData.slice(startIndex, endIndex);

  // Get unique days for selected month
  const getDaysForMonth = (monthData: any) => {
    const days = new Set<string>();
    monthData.logs.forEach((log: WorkshopLog) => {
      if (log.date) {
        days.add(log.date);
      }
    });
    return Array.from(days).sort();
  };

  // Get records for specific day
  const getRecordsForDay = (monthData: any, day: string) => {
    const log = monthData.logs.find((log: WorkshopLog) => log.date === day);
    return log ? log.log_data : [];
  };

  const handleExportWithDateRange = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Error",
        description: "Please select a date range",
        variant: "destructive",
      });
      return;
    }

    const startDate = dateRange.from.toISOString().split('T')[0];
    const endDate = dateRange.to.toISOString().split('T')[0];

    try {
      // Get all workshop check-ins within the date range
      const { data: workshopLogs, error } = await supabase
        .from('workshop_check_ins')
        .select('*')
        .gte('check_in_time', startDate)
        .lte('check_in_time', endDate)
        .order('check_in_time', { ascending: true });

      if (error) throw error;

      if (!workshopLogs || workshopLogs.length === 0) {
        toast({
          title: "No Records",
          description: "No workshop records found in the selected date range",
          variant: "destructive",
        });
        return;
      }

      // Prepare export data
      const exportData = workshopLogs.map(record => ({
        'Full Name': record.full_name,
        'Email': record.email || '',
        'Phone': record.phone || '',
        'Company': record.company || '',
        'Workshop Type': record.workshop_type || '',
        'Check In Time': new Date(record.check_in_time).toLocaleString(),
        'Check Out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : '',
        'Status': record.check_out_time ? 'Checked Out' : 'Active',
        'Special Notes': record.special_notes || ''
      }));

      // Export to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `workshop_checkins_${startDate}_to_${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${workshopLogs.length} workshop records from ${startDate} to ${endDate}`,
      });

      // Close dialog and reset
      setShowExportDialog(false);
      setDateRange({ from: undefined, to: undefined });

    } catch (error) {
      console.error('Error exporting workshop records:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export workshop records. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = (records: any[], filename: string) => {
    if (records.length === 0) {
      toast({
        title: "No Data",
        description: "No records available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Full Name', 'Email', 'Phone', 'Company', 'Workshop Type', 'Check In Time', 'Check Out Time', 'Special Notes'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        record.full_name || '',
        record.email || '',
        record.phone || '',
        record.company || '',
        record.workshop_type || '',
        record.check_in_time || '',
        record.check_out_time || '',
        record.special_notes || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${records.length} records to CSV`,
    });
  };

  const deleteLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('workshop_check_ins')
        .delete()
        .eq('id', logId);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to delete log: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Log deleted successfully",
      });
      loadSavedLogs();
    } catch (error: any) {
      console.error('Error deleting log:', error);
      toast({
        title: "Error",
        description: `Failed to delete log: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Loading workshop stored records...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 mt-[5px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/workshop')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Archive className="w-8 h-8 text-primary" />
                Workshop Stored Records
              </h1>
              <p className="text-muted-foreground mt-1">
                Access and manage archived workshop check-in logs
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export with Date Range
          </Button>
        </div>

        {currentRecords.length === 0 ? (
          <Card className="p-8 text-center">
            <Archive className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Stored Workshop Records</h3>
            <p className="text-muted-foreground">
              Daily workshop logs will appear here after you save them from the workshop dashboard.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate('/workshop')}
            >
              Go to Workshop Check-In
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Monthly Logs */}
            {currentRecords.map((monthData: any, monthIndex: number) => (
              <Card key={`${monthData.year}-${monthData.month}`} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {monthData.month} {monthData.year}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {monthData.logs.length} daily logs saved
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allRecords = monthData.logs.flatMap((log: WorkshopLog) => log.log_data);
                      exportToCSV(allRecords, `workshop-${monthData.month.toLowerCase()}-${monthData.year}`);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Month
                  </Button>
                </div>

                {/* Days for this month */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
                  {getDaysForMonth(monthData).map((day: string) => (
                    <Button
                      key={day}
                      variant={selectedDay === day ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedMonth(`${monthData.year}-${monthData.month}`);
                        setSelectedDay(day);
                        setSelectedDayRecords(getRecordsForDay(monthData, day));
                      }}
                      className="h-10"
                    >
                      {new Date(day).getDate()}
                    </Button>
                  ))}
                </div>

                {/* Selected Day Records */}
                {selectedDay && selectedMonth === `${monthData.year}-${monthData.month}` && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        Records for {new Date(selectedDay).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToCSV(selectedDayRecords, `workshop-${selectedDay}`)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Day
                      </Button>
                    </div>

                    {selectedDayRecords.length === 0 ? (
                      <Card className="p-4 text-center">
                        <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground">No records found for this day</p>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {selectedDayRecords.map((record: any, index: number) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-primary">
                                      {record.date && !isNaN(new Date(record.date).getTime())
                                        ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
                                        : 'Invalid Date'}
                                    </span>
                                    <span className="text-lg font-semibold text-muted-foreground">
                                      {record.date && !isNaN(new Date(record.date).getTime())
                                        ? new Date(record.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                        : 'Invalid Date'}
                                    </span>
                                  </div>
                                  <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-[7px]">
                                    {1} record
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Saved on {record.saved_at && !isNaN(new Date(record.saved_at).getTime())
                                    ? new Date(record.saved_at).toLocaleDateString()
                                    : 'Invalid Date'} at {record.saved_at && !isNaN(new Date(record.saved_at).getTime())
                                      ? new Date(record.saved_at).toLocaleTimeString()
                                      : 'Invalid Time'}
                                </p>
                                <div className="mt-2 space-y-1">
                                  <p className="font-medium text-foreground">{record.full_name}</p>
                                  {record.email && <p className="text-sm text-muted-foreground">{record.email}</p>}
                                  {record.phone && <p className="text-sm text-muted-foreground">{record.phone}</p>}
                                  {record.company && <p className="text-sm text-muted-foreground">{record.company}</p>}
                                  {record.workshop_type && (
                                    <Badge className="mt-1 bg-primary text-primary-foreground">
                                      {record.workshop_type}
                                    </Badge>
                                  )}
                                  {record.special_notes && (
                                    <p className="text-sm text-muted-foreground mt-1">{record.special_notes}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => exportToCSV([record], `workshop-record-${record.full_name.replace(/\s+/g, '-').toLowerCase()}`)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteLog(record.id)}
                                  className="hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-card border-t mt-4 rounded-b-[7px]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedMonthlyData.length)} of {sortedMonthlyData.length} months
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Export Workshop Logs</DialogTitle>
              <DialogDescription>
                Select date range and export format for workshop logs
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Date Range</label>
                <div className="border rounded-md p-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">From Date</label>
                      <input
                        type="date"
                        value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">To Date</label>
                      <input
                        type="date"
                        value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {dateRange.from && dateRange.to && (
                <div className="text-center text-sm text-muted-foreground">
                  Selected: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowExportDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExportWithDateRange}
                  disabled={!dateRange.from || !dateRange.to}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Workshop Logs
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
