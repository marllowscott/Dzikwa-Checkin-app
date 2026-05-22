import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Search, Eye, Trash2, FileSpreadsheet, FileText, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

interface GuestSavedLog {
    id: string;
    date: string;
    month: string;
    total_records: number;
    log_data: any;
    json_content: string;
    summary_content: string;
    saved_at: string;
}

export default function GuestStoredRecords() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [savedGuestLogs, setSavedGuestLogs] = useState<GuestSavedLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [viewingLog, setViewingLog] = useState<GuestSavedLog | null>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportType, setExportType] = useState<'excel' | 'pdf' | 'word'>('excel');
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined } | undefined>(undefined);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(10); // Show 10 records per page for guest logs

    // Helper function to get day of week
    const getDayOfWeek = (dateString: string) => {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid' : date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    useEffect(() => {
        loadSavedGuestLogs();
    }, []);

    // Reset to first page when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedMonth]);

    const loadSavedGuestLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('saved_guest_logs')
                .select('*')
                .order('saved_at', { ascending: false });

            if (error) throw error;
            setSavedGuestLogs(data || []);
        } catch (error) {
            console.error('Error loading saved guest logs:', error);
            toast({
                title: "Error",
                description: "Failed to load saved guest logs",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewLog = (log: GuestSavedLog) => {
        setViewingLog(log);
        setShowViewDialog(true);
    };

    const handleDeleteLog = async (logId: string, logDate: string) => {
        if (!confirm(`Are you sure you want to delete the guest log from ${new Date(logDate).toLocaleDateString()}? This action cannot be undone.`)) return;

        try {
            const { error } = await supabase
                .from('saved_guest_logs')
                .delete()
                .eq('id', logId);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Guest log deleted successfully",
            });

            loadSavedGuestLogs();
        } catch (error) {
            console.error('Error deleting saved guest log:', error);
            toast({
                title: "Error",
                description: "Failed to delete guest log",
                variant: "destructive",
            });
        }
    };

    // Export functions
    const downloadLogAsExcel = (log: GuestSavedLog) => {
        try {
            const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;
            const ws = XLSX.utils.json_to_sheet(logData.map((record: any) => ({
                'Full Name': record.guests?.full_name || 'Unknown',
                'Email': record.guests?.email || '',
                'Phone': record.guests?.phone || '',
                'Company': record.guests?.company || '',
                'Purpose': record.purpose || '',
                'Check In Time': new Date(record.check_in_time).toLocaleString(),
                'Check Out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out',
                'Day': getDayOfWeek(record.check_in_time),
                'Status': record.check_out_time ? 'Checked Out' : 'Active'
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "GuestCheckIns");
            XLSX.writeFile(wb, `guest_checkins_${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}.xlsx`);
        } catch (error) {
            console.error('Error downloading Excel:', error);
            toast({
                title: "Error",
                description: "Failed to download Excel file",
                variant: "destructive",
            });
        }
    };

    const downloadLogAsPDF = (log: GuestSavedLog) => {
        try {
            const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text('Guest Check-in Report', 14, 22);
            doc.setFontSize(12);
            doc.text(`Date: ${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}`, 14, 32);
            doc.text(`Total Check-ins: ${log.total_records}`, 14, 42);

            let yPosition = 52;
            logData.forEach((record: any, index: number) => {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(`${index + 1}. ${record.guests?.full_name || 'Unknown'} - ${new Date(record.check_in_time).toLocaleString()} - ${record.check_out_time ? 'Checked Out' : 'Active'}`, 14, yPosition);
                yPosition += 8;
            });

            doc.save(`guest_checkins_${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}.pdf`);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast({
                title: "Error",
                description: "Failed to download PDF file",
                variant: "destructive",
            });
        }
    };

    const downloadLogAsWord = (log: GuestSavedLog) => {
        try {
            const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;
            let wordContent = `<html><head><title>Guest Check-in Report</title></head><body>`;
            wordContent += `<h1>Guest Check-in Report</h1>`;
            wordContent += `<p><strong>Date:</strong> ${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</p>`;
            wordContent += `<p><strong>Total Check-ins:</strong> ${log.total_records}</p>`;
            wordContent += `<table border="1" style="border-collapse: collapse; width: 100%;">`;
            wordContent += `<tr><th>Name</th><th>Company</th><th>Check-in Time</th><th>Check-out Time</th><th>Status</th></tr>`;

            logData.forEach((record: any) => {
                wordContent += `<tr>`;
                wordContent += `<td>${record.guests?.full_name || 'Unknown'}</td>`;
                wordContent += `<td>${record.guests?.company || ''}</td>`;
                wordContent += `<td>${new Date(record.check_in_time).toLocaleString()}</td>`;
                wordContent += `<td>${record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'}</td>`;
                wordContent += `<td>${record.check_out_time ? 'Checked Out' : 'Active'}</td>`;
                wordContent += `</tr>`;
            });

            wordContent += `</table></body></html>`;

            const blob = new Blob([wordContent], { type: 'application/msword' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `guest_checkins_${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}.doc`;
            link.click();
        } catch (error) {
            console.error('Error downloading Word:', error);
            toast({
                title: "Error",
                description: "Failed to download Word file",
                variant: "destructive",
            });
        }
    };

    // Advanced export with date range
    const handleExportWithDateRange = async () => {
        if (!dateRange || !dateRange.from || !dateRange.to) {
            toast({
                title: "Error",
                description: "Please select a date range",
                variant: "destructive"
            });
            return;
        }

        try {
            const { data: guestLogs, error } = await supabase
                .from('saved_guest_logs')
                .select('*')
                .gte('date', dateRange.from.toISOString().split('T')[0])
                .lte('date', dateRange.to.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) throw error;

            if (!guestLogs || guestLogs.length === 0) {
                toast({
                    title: "No Data",
                    description: "No guest logs found in the selected date range",
                    variant: "destructive"
                });
                return;
            }

            // Combine all logs in the date range
            const allRecords = guestLogs.flatMap(log => {
                const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;
                return logData.map((record: any) => ({
                    ...record,
                    saved_log_date: log.date,
                    saved_log_id: log.id
                }));
            });

            const exportData = allRecords.map((record: any) => ({
                'Full Name': record.guests?.full_name || 'Unknown',
                'Email': record.guests?.email || '',
                'Phone': record.guests?.phone || '',
                'Company': record.guests?.company || '',
                'Purpose': record.purpose || '',
                'Check In Time': new Date(record.check_in_time).toLocaleString(),
                'Check Out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out',
                'Day': getDayOfWeek(record.check_in_time),
                'Status': record.check_out_time ? 'Checked Out' : 'Active',
                'Saved Date': new Date(record.saved_log_date).toLocaleDateString()
            }));

            if (exportType === 'excel') {
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "GuestCheckIns");
                XLSX.writeFile(wb, `guest_checkins_${dateRange.from.toISOString().split('T')[0]}_to_${dateRange.to.toISOString().split('T')[0]}.xlsx`);
            } else if (exportType === 'pdf') {
                const doc = new jsPDF();
                doc.setFontSize(18);
                doc.text('Guest Check-in Report', 14, 22);
                doc.setFontSize(12);
                doc.text(`Date Range: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`, 14, 32);
                doc.text(`Total Check-ins: ${allRecords.length}`, 14, 42);

                let yPosition = 52;
                exportData.forEach((item, index) => {
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    doc.text(`${index + 1}. ${item['Full Name']} - ${item['Check In Time']} - ${item['Status']}`, 14, yPosition);
                    yPosition += 8;
                });

                doc.save(`guest_checkins_${dateRange.from.toISOString().split('T')[0]}_to_${dateRange.to.toISOString().split('T')[0]}.pdf`);
            } else if (exportType === 'word') {
                let wordContent = `<html><head><title>Guest Check-in Report</title></head><body>`;
                wordContent += `<h1>Guest Check-in Report</h1>`;
                wordContent += `<p><strong>Date Range:</strong> ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}</p>`;
                wordContent += `<p><strong>Total Check-ins:</strong> ${allRecords.length}</p>`;
                wordContent += `<table border="1" style="border-collapse: collapse; width: 100%;">`;
                wordContent += `<tr><th>Name</th><th>Company</th><th>Check-in Time</th><th>Check-out Time</th><th>Status</th></tr>`;

                exportData.forEach(item => {
                    wordContent += `<tr>`;
                    wordContent += `<td>${item['Full Name']}</td>`;
                    wordContent += `<td>${item['Company']}</td>`;
                    wordContent += `<td>${item['Check In Time']}</td>`;
                    wordContent += `<td>${item['Check Out Time']}</td>`;
                    wordContent += `<td>${item['Status']}</td>`;
                    wordContent += `</tr>`;
                });

                wordContent += `</table></body></html>`;

                const blob = new Blob([wordContent], { type: 'application/msword' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `guest_checkins_${dateRange.from.toISOString().split('T')[0]}_to_${dateRange.to.toISOString().split('T')[0]}.doc`;
                link.click();
            }

            toast({
                title: "Success",
                description: `Guest check-ins exported successfully as ${exportType.toUpperCase()}`
            });

            setShowExportDialog(false);
            setDateRange(undefined);

        } catch (error: any) {
            console.error('Error exporting guest check-ins:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to export guest check-ins",
                variant: "destructive"
            });
        }
    };

    // Filter logs
    const filteredLogs = savedGuestLogs.filter(log => {
        const matchesSearch = searchTerm === "" ||
            new Date(log.date).toLocaleDateString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.summary_content.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesMonth = selectedMonth === "all" || log.month === selectedMonth;

        return matchesSearch && matchesMonth;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredLogs.length / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const currentRecords = filteredLogs.slice(startIndex, endIndex);

    // Get unique months for filter
    const uniqueMonths = Array.from(new Set(savedGuestLogs.map(log => log.month))).sort();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 mt-[5px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate('/guest-dashboard')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <FileText className="h-6 w-6" />
                                    Guest Stored Records
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    View and manage archived guest check-in logs
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowExportDialog(true)}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export with Date Range
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/guest-dashboard')}
                            >
                                Back to Guest Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search guest logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filter by month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                {uniqueMonths.map(month => (
                                    <SelectItem key={month} value={month}>
                                        {month}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                    </div>
                </Card>

                {/* Logs Table */}
                <Card className="p-4">
                    {loading ? (
                        <div className="text-center py-8">Loading guest logs...</div>
                    ) : currentRecords.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No guest logs found
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Month</TableHead>
                                            <TableHead>Records</TableHead>
                                            <TableHead>Saved At</TableHead>
                                            <TableHead>Summary</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentRecords.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">
                                                    {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{log.month}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{log.total_records}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(log.saved_at).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate" title={log.summary_content}>
                                                        {log.summary_content.substring(0, 50)}...
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setViewingLog(log);
                                                                setShowViewDialog(true);
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDeleteLog(log.id, log.date)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 bg-card border-t mt-4 rounded-b-[7px]">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>
                                            Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} records
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
                        </>
                    )}
                </Card>
            </div>

            {/* View Log Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Guest Log Details</DialogTitle>
                        <DialogDescription>
                            Complete guest check-in data for {viewingLog && new Date(viewingLog.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                        </DialogDescription>
                    </DialogHeader>
                    {viewingLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">Date</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(viewingLog.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Total Records</p>
                                    <p className="text-sm text-muted-foreground">{viewingLog.total_records}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Saved At</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(viewingLog.saved_at).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Month</p>
                                    <p className="text-sm text-muted-foreground">{viewingLog.month}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium mb-2">Summary</p>
                                <pre className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                                    {viewingLog.summary_content}
                                </pre>
                            </div>

                            <div>
                                <p className="text-sm font-medium mb-2">Guest Check-in Records</p>
                                <div className="rounded-md border overflow-x-auto max-h-96">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Guest Name</TableHead>
                                                <TableHead>Company</TableHead>
                                                <TableHead>Check-in Time</TableHead>
                                                <TableHead>Check-out Time</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(typeof viewingLog.log_data === 'string' ? JSON.parse(viewingLog.log_data) : viewingLog.log_data).map((record: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">
                                                        {record.guests?.full_name || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell>{record.guests?.company || '-'}</TableCell>
                                                    <TableCell>
                                                        {new Date(record.check_in_time).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={record.check_out_time ? "default" : "secondary"}>
                                                            {record.check_out_time ? 'Checked Out' : 'Active'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Export Dialog */}
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Export Guest Logs</DialogTitle>
                        <DialogDescription>
                            Select date range and export format for guest logs
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Export Format</label>
                            <Select value={exportType} onValueChange={(value: 'excel' | 'pdf' | 'word') => setExportType(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select export format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                                    <SelectItem value="word">Word (.doc)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Date Range</label>
                            <div className="border rounded-md p-3">
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    className="rounded-md w-full"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleExportWithDateRange} disabled={!dateRange || !dateRange.from || !dateRange.to}>
                                Export
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
