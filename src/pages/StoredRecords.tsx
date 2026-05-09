import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase, SavedLog } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, Calendar, Archive, Edit, Trash2, Eye, Search, X, Save, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface MonthlyLogs {
  month: string;
  year: number;
  logs: SavedLog[];
}

export default function StoredRecords() {
  const [savedLogs, setSavedLogs] = useState<SavedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLog, setEditingLog] = useState<SavedLog | null>(null);
  const [viewingLog, setViewingLog] = useState<{ log: SavedLog; type: 'summary' } | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    month: "",
    summary_content: ""
  });
  const [exportDialog, setExportDialog] = useState<{ open: boolean; type: 'excel' | 'word' | 'pdf' | null }>({ open: false, type: null });
  const [selectedRange, setSelectedRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      navigate("/admin-login");
      return;
    }

    loadSavedLogs();
  }, [navigate]);

  const loadSavedLogs = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading saved logs for Records Storage...');

      const { data: logs, error } = await supabase
        .from('saved_logs')
        .select('*')
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });

        // Check if it's a table not found error
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          toast({
            title: "Database Setup Required",
            description: "The saved_logs table doesn't exist. Please run the SQL schema in your Supabase dashboard.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        console.log('✅ Successfully loaded saved logs:', logs?.length || 0, 'records');

        // Clean up any existing records with invalid data
        const cleanedLogs = (logs || []).map(log => ({
          ...log,
          date: log.date && !isNaN(new Date(log.date).getTime()) ? log.date : null,
          month: log.month && log.month.includes('-') && !isNaN(new Date(log.month + '-01').getTime()) ? log.month : null,
          saved_at: log.saved_at && !isNaN(new Date(log.saved_at).getTime()) ? log.saved_at : null
        }));

        setSavedLogs(cleanedLogs);
      }
    } catch (error: any) {
      console.error('💥 Unexpected error loading saved logs:', error);
      toast({
        title: "Error",
        description: `Failed to load stored records: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const monthlyData = savedLogs.reduce((acc, log) => {
    // Skip invalid month entries entirely
    if (!log.month || !log.month.includes('-')) {
      return acc;
    }

    const year = log.month.split('-')[0];
    const parsedYear = parseInt(year);

    // Skip if year is invalid
    if (isNaN(parsedYear)) {
      return acc;
    }

    const key = `${year}-${log.month}`;
    if (!acc[key]) {
      // Validate month date creation
      const monthDate = !isNaN(new Date(log.month + '-01').getTime())
        ? new Date(log.month + '-01').toLocaleDateString('en-US', { month: 'long' })
        : 'Invalid Month';

      // Skip invalid months entirely
      if (monthDate === 'Invalid Month') {
        return acc;
      }

      acc[key] = {
        month: monthDate,
        year: parsedYear,
        logs: []
      };
    }
    acc[key].logs.push(log);
    return acc;
  }, {} as Record<string, MonthlyLogs>);

  const filteredMonthlyData = Object.values(monthlyData)
    .filter(monthData =>
      monthData.logs.some(log =>
        log.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.total_records.toString().includes(searchTerm)
      )
    )
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

  const handleBackToMain = () => {
    navigate("/");
    toast({
      title: "Navigation",
      description: "Returning to main check-in interface.",
    });
  };

  // Edit and Delete functions
  const openEditDialog = (log: SavedLog) => {
    setEditingLog(log);
    setEditForm({
      date: log.date,
      month: log.month,
      summary_content: log.summary_content || ''
    });
  };

  const handleEdit = async () => {
    if (!editingLog) return;

    try {
      const { error } = await supabase
        .from('saved_logs')
        .update({
          date: editForm.date,
          month: editForm.month,
          summary_content: editForm.summary_content
        })
        .eq('id', editingLog.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record updated successfully.",
      });

      setEditingLog(null);
      loadSavedLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update record: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record deleted successfully.",
      });

      loadSavedLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete record: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Download content utility function
  const downloadContent = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export functions
  const exportToExcel = (log: SavedLog) => {
    setExportDialog({ open: true, type: 'excel' });
  };

  const exportToWord = (log: SavedLog) => {
    setExportDialog({ open: true, type: 'word' });
  };

  const exportToPDF = (log: SavedLog) => {
    setExportDialog({ open: true, type: 'pdf' });
  };

  const handleExportWithDateRange = async () => {
    if (!selectedRange.from || !selectedRange.to) {
      toast({
        title: "Error",
        description: "Please select a date range",
        variant: "destructive",
      });
      return;
    }

    const startDate = selectedRange.from.toISOString().split('T')[0];
    const endDate = selectedRange.to.toISOString().split('T')[0];

    try {
      // Get all logs within the date range
      const { data: logsInRange, error } = await supabase
        .from('saved_logs')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!logsInRange || logsInRange.length === 0) {
        toast({
          title: "No Records",
          description: "No records found in the selected date range",
          variant: "destructive",
        });
        return;
      }

      // Combine all data from the selected logs
      const allRecords = [];
      for (const log of logsInRange) {
        try {
          const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;
          if (Array.isArray(logData)) {
            allRecords.push(...logData);
          } else {
            console.warn('Invalid log_data format for log:', log.id);
          }
        } catch (error) {
          console.error('Failed to parse log_data for log:', log.id, error);
        }
      }

      // Export based on selected type
      if (exportDialog.type === 'excel') {
        const ws = XLSX.utils.json_to_sheet(allRecords.map((record: any) => ({
          'Full Name': record.userName || record.full_name || 'N/A',
          'Check In Time': (record.checkInTime && !isNaN(new Date(record.checkInTime).getTime())) ? record.checkInTime : (record.check_in_time && !isNaN(new Date(record.check_in_time).getTime())) ? record.check_in_time : 'N/A',
          'Check Out Time': (record.checkOutTime && !isNaN(new Date(record.checkOutTime).getTime())) ? record.checkOutTime : (record.check_out_time && !isNaN(new Date(record.check_out_time).getTime())) ? record.check_out_time : 'Not checked out',
          'Date': (record.date && !isNaN(new Date(record.date).getTime())) ? record.date : 'N/A'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CheckInRecords");
        XLSX.writeFile(wb, `CheckIn_Records_${startDate}_to_${endDate}.xlsx`);
      } else if (exportDialog.type === 'word') {
        const wordContent = `
          <html>
            <head>
              <meta charset="utf-8">
              <title>Check-In Records ${startDate} to ${endDate}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
              </style>
            </head>
            <body>
              <h1>Check-In Records: ${startDate} to ${endDate}</h1>
              <p><strong>Total Records:</strong> ${allRecords.length}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <table>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Check In Time</th>
                    <th>Check Out Time</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                   ${allRecords.map((record: any) => `
                     <tr>
                       <td>${record.userName || record.full_name || 'N/A'}</td>
                       <td>${(record.checkInTime && !isNaN(new Date(record.checkInTime).getTime())) ? record.checkInTime : (record.check_in_time && !isNaN(new Date(record.check_in_time).getTime())) ? record.check_in_time : 'N/A'}</td>
                       <td>${(record.checkOutTime && !isNaN(new Date(record.checkOutTime).getTime())) ? record.checkOutTime : (record.check_out_time && !isNaN(new Date(record.check_out_time).getTime())) ? record.check_out_time : 'Not checked out'}</td>
                       <td>${(record.date && !isNaN(new Date(record.date).getTime())) ? record.date : 'N/A'}</td>
                     </tr>
                   `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `;

        const blob = new Blob([wordContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CheckIn_Records_${startDate}_to_${endDate}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (exportDialog.type === 'pdf') {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text(`Check-In Records: ${startDate} to ${endDate}`, 20, 20);

        // Summary info
        doc.setFontSize(12);
        doc.text(`Total Records: ${allRecords.length}`, 20, 35);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);

        // Table headers
        doc.setFontSize(10);
        let y = 60;
        doc.text('Name', 20, y);
        doc.text('Check In', 70, y);
        doc.text('Check Out', 120, y);
        doc.text('Date', 170, y);

        // Draw line under headers
        doc.line(20, y + 2, 200, y + 2);

        y += 10;

        // Table data
        allRecords.forEach((record: any) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            doc.text('Name', 20, y);
            doc.text('Check In', 70, y);
            doc.text('Check Out', 120, y);
            doc.text('Date', 170, y);
            doc.line(20, y + 2, 200, y + 2);
            y += 10;
          }

          const name = (record.userName || record.full_name || 'N/A').substring(0, 20);
          const checkIn = ((record.checkInTime && !isNaN(new Date(record.checkInTime).getTime())) ? record.checkInTime : (record.check_in_time && !isNaN(new Date(record.check_in_time).getTime())) ? record.check_in_time : 'N/A').substring(0, 20);
          const checkOut = ((record.checkOutTime && !isNaN(new Date(record.checkOutTime).getTime())) ? record.checkOutTime : (record.check_out_time && !isNaN(new Date(record.check_out_time).getTime())) ? record.check_out_time : 'Not checked out').substring(0, 20);
          const date = ((record.date && !isNaN(new Date(record.date).getTime())) ? record.date : 'N/A').substring(0, 15);

          doc.text(name, 20, y);
          doc.text(checkIn, 70, y);
          doc.text(checkOut, 120, y);
          doc.text(date, 170, y);
          y += 8;
        });

        doc.save(`CheckIn_Records_${startDate}_to_${endDate}.pdf`);
      }

      toast({
        title: "Export Successful",
        description: `Exported ${allRecords.length} records from ${startDate} to ${endDate}`,
      });

      // Close dialog and reset
      setExportDialog({ open: false, type: null });
      setSelectedRange({ from: undefined, to: undefined });

    } catch (error) {
      console.error('Error exporting with date range:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export records. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading stored records...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/admin-dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Archive className="w-8 h-8 text-primary" />
                  Stored Records
                </h1>
                <p className="text-muted-foreground mt-1">
                  Access and manage archived daily check-in logs
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setExportDialog({ open: true, type: null })}
                className="w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Export with Date Range
              </Button>
              <Button variant="outline" onClick={handleBackToMain} className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Back to Main
              </Button>
            </div>
          </div>

          {/* Search */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-primary" />
              <Input
                placeholder="Search by date or record count..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </Card>

          {/* Records */}
          <div className="space-y-6">
            {filteredMonthlyData.length === 0 ? (
              <Card className="p-8 text-center">
                <Archive className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Stored Records</h3>
                <p className="text-muted-foreground">
                  Daily logs will appear here after you save them from the admin dashboard.
                </p>
              </Card>
            ) : (
              filteredMonthlyData.map((monthData) => (
                <Card key={`${monthData.year}-${monthData.month}`} className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Calendar className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold">
                      {monthData.month} {monthData.year}
                    </h2>
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-[7px]">
                      {monthData.logs.length} log{monthData.logs.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {monthData.logs.map((log) => (
                      <div
                        key={log.id}
                        className="border rounded-[7px] p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary">
                                  {log.date && !isNaN(new Date(log.date).getTime())
                                    ? new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
                                    : 'Invalid Date'}
                                </span>
                                <span className="text-lg font-semibold text-muted-foreground">
                                  {log.date && !isNaN(new Date(log.date).getTime())
                                    ? new Date(log.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                    : 'Invalid Date'}
                                </span>
                              </div>
                              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-[7px]">
                                {log.total_records} records
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Saved on {log.saved_at && !isNaN(new Date(log.saved_at).getTime())
                                ? new Date(log.saved_at).toLocaleDateString()
                                : 'Invalid Date'} at {log.saved_at && !isNaN(new Date(log.saved_at).getTime())
                                  ? new Date(log.saved_at).toLocaleTimeString()
                                  : 'Invalid Time'}
                            </p>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(log)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(log.id)}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewingLog} onOpenChange={() => setViewingLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {viewingLog && `${viewingLog.log.date} - Summary View`}
            </DialogTitle>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{viewingLog.log.total_records} records</span>
                <span>Saved on {new Date(viewingLog.log.saved_at).toLocaleDateString()}</span>
              </div>
              <div className="border rounded-lg p-4 overflow-auto max-h-[60vh] bg-muted/30">
                <pre className="text-sm whitespace-pre-wrap">
                  {viewingLog.log.summary_content}
                </pre>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    const content = viewingLog.log.summary_content;
                    const filename = `${viewingLog.log.date}_DailyLogs_summary.txt`;
                    const mimeType = 'text/plain';
                    downloadContent(content, filename, mimeType);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Summary
                </Button>
                <Button variant="outline" onClick={() => setViewingLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Date Range Dialog */}
      <Dialog open={exportDialog.open} onOpenChange={(open) => !open && setExportDialog({ open: false, type: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export {exportDialog.type?.toUpperCase()} - Select Date Range
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={(range) => setSelectedRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className="rounded-md border"
                styles={{
                  head: { color: 'var(--foreground)' },
                  caption: { color: 'var(--foreground)' },
                  nav_button_previous: { color: 'var(--foreground)' },
                  nav_button_next: { color: 'var(--foreground)' },
                  day: { color: 'var(--foreground)' },
                  selected: {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    fontWeight: 'bold'
                  },
                  range_middle: {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  },
                  range_start: {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    fontWeight: 'bold'
                  },
                  range_end: {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    fontWeight: 'bold'
                  },
                  today: {
                    backgroundColor: 'var(--muted)',
                    color: 'var(--foreground)'
                  }
                } as any}
              />
            </div>

            {selectedRange.from && selectedRange.to && (
              <div className="text-center text-sm text-muted-foreground">
                Selected: {selectedRange.from.toLocaleDateString()} - {selectedRange.to.toLocaleDateString()}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setExportDialog({ open: false, type: null });
                setSelectedRange({ from: undefined, to: undefined });
              }}>
                Cancel
              </Button>``
              <Button
                onClick={handleExportWithDateRange}
                disabled={!selectedRange.from || !selectedRange.to}
              >
                <Download className="w-4 h-4 mr-2" />
                Export {exportDialog.type?.toUpperCase()}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLog} onOpenChange={() => setEditingLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Stored Record
            </DialogTitle>
          </DialogHeader>
          {editingLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Month (YYYY-MM)</label>
                  <Input
                    value={editForm.month}
                    onChange={(e) => setEditForm({ ...editForm, month: e.target.value })}
                    placeholder="2024-09"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Summary Content</label>
                <Textarea
                  value={editForm.summary_content}
                  onChange={(e) => setEditForm({ ...editForm, summary_content: e.target.value })}
                  rows={6}
                  placeholder="Edit the summary content..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingLog(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEdit}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}