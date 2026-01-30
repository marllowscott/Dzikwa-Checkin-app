import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase, CheckInRecord, FileRecord, SavedLog } from "@/lib/supabase";

interface MonthlyData {
  month: string;
  year: number;
  days: { [day: string]: CheckInRecord[] };
}
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, TrendingUp, Loader2, Download, Edit, Trash2, Plus, Filter, LogOut, FileText, Upload, Eye, File, Save, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { CheckInIcon } from "@/components/ui/CheckInIcon";
import { AdminIcon } from "@/components/ui/AdminIcon";
import { LogoutIcon } from "@/components/ui/LogoutIcon";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';

export default function AdminDashboard() {
  const [data, setData] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fullName: "",
    dateFrom: "",
    dateTo: "",
    status: "all"
  });
  const [editingRecord, setEditingRecord] = useState<CheckInRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    full_name: "",
    check_in_time: "",
    check_out_time: ""
  });
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isRecordsCollapsed, setIsRecordsCollapsed] = useState(false);
  const [isFilesCollapsed, setIsFilesCollapsed] = useState(false);
  const [fileSearch, setFileSearch] = useState("");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // Dashboard state
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [dashboardFilters, setDashboardFilters] = useState({
    fullName: "",
    dateFrom: "",
    dateTo: ""
  });
  const [savedLogs, setSavedLogs] = useState<SavedLog[]>([]);
  const [activeCheckIns, setActiveCheckIns] = useState<CheckInRecord[]>([]);
  const [selectedSavedLog, setSelectedSavedLog] = useState<SavedLog | null>(null);
  const [showSavedLogModal, setShowSavedLogModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      navigate("/admin-login");
      return;
    }

    fetchData();
    fetchFiles();
    loadSavedLogs();
    fetchActiveCheckIns();
  }, [navigate]);

  // Add automatic logout when leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("isAdmin");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User is leaving the tab or minimizing
        localStorage.removeItem("isAdmin");
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadSavedLogs = async () => {
    try {
      console.log('🔍 Attempting to load saved logs from database...');

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
        setSavedLogs(logs || []);
      }
    } catch (error: any) {
      console.error('💥 Unexpected error loading saved logs:', error);
      toast({
        title: "Error",
        description: `Failed to load saved logs: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const saveLogsToStorage = async (logs: any[]) => {
    try {
      for (const log of logs) {
        const { error } = await supabase
          .from('saved_logs')
          .insert([{
            date: log.date,
            month: log.month,
            total_records: log.totalRecords,
            log_data: log.data,
            json_content: log.jsonContent,
            csv_content: log.csvContent,
            summary_content: log.summaryContent,
            saved_by: 'admin'
          }]);

        if (error) throw error;
      }

      // Reload saved logs
      await loadSavedLogs();

      toast({
        title: "Success",
        description: "Logs saved to database successfully",
      });
    } catch (error) {
      console.error('Error saving logs to database:', error);
      toast({
        title: "Error",
        description: "Failed to save logs to database",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: records, error } = await supabase
        .from('check_ins')
        .select('*')
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setData(records || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const { data: fileRecords, error } = await supabase
        .from('files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(fileRecords || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    }
  };

  const fetchActiveCheckIns = async () => {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data: activeRecords, error } = await supabase
        .from('check_ins')
        .select('*')
        .gte('check_in_time', startOfDay.toISOString())
        .lt('check_in_time', endOfDay.toISOString())
        .is('check_out_time', null) // Only records that haven't checked out
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setActiveCheckIns(activeRecords || []);
    } catch (error) {
      console.error('Error fetching active check-ins:', error);
      toast({
        title: "Error",
        description: "Failed to load active check-ins",
        variant: "destructive",
      });
    }
  };

  const handleIndividualCheckout = async (checkInId: string) => {
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({
          check_out_time: new Date().toISOString(),
          checked_out: true
        })
        .eq('id', checkInId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee checked out successfully",
      });

      // Refresh data
      fetchData();
      fetchActiveCheckIns();
    } catch (error) {
      console.error('Error checking out employee:', error);
      toast({
        title: "Error",
        description: "Failed to check out employee",
        variant: "destructive",
      });
    }
  };

  const handleViewSavedLog = (log: SavedLog) => {
    setSelectedSavedLog(log);
    setShowSavedLogModal(true);
  };

  const handleDeleteSavedLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this saved log? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('saved_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Saved log deleted successfully",
      });

      // Refresh saved logs
      loadSavedLogs();
    } catch (error) {
      console.error('Error deleting saved log:', error);
      toast({
        title: "Error",
        description: "Failed to delete saved log",
        variant: "destructive",
      });
    }
  };

  const handleRestoreSavedLog = async (log: SavedLog) => {
    if (!confirm(`Are you sure you want to restore ${log.total_records} records from ${log.date} back to active check-ins? This will add them back to the main records table.`)) return;

    try {
      // Parse the log data
      const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;

      // Convert log data back to check_ins format
      const recordsToRestore = logData.map((record: any) => {
        // Parse the check-in and check-out times back to ISO format
        const checkInTime = new Date(record.checkInTime);
        const checkOutTime = record.checkOutTime && record.checkOutTime !== "Not checked out"
          ? new Date(record.checkOutTime)
          : null;

        return {
          full_name: record.userName,
          check_in_time: checkInTime.toISOString(),
          check_out_time: checkOutTime ? checkOutTime.toISOString() : null,
          created_at: new Date().toISOString()
        };
      });

      // Insert records back into check_ins table
      const { error: insertError } = await supabase
        .from('check_ins')
        .insert(recordsToRestore);

      if (insertError) throw insertError;

      // Delete the saved log after successful restore
      const { error: deleteError } = await supabase
        .from('saved_logs')
        .delete()
        .eq('id', log.id);

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: `${recordsToRestore.length} records restored to active check-ins successfully`,
      });

      // Refresh all data
      fetchData();
      loadSavedLogs();
      fetchActiveCheckIns();
    } catch (error) {
      console.error('Error restoring saved log:', error);
      toast({
        title: "Error",
        description: "Failed to restore saved log. Please check the data format.",
        variant: "destructive",
      });
    }
  };

  const downloadSavedLogAsExcel = (log: SavedLog) => {
    try {
      // Parse the log data
      const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;

      // Create Excel data
      const excelData = logData.map((record: any) => ({
        'Full Name': record.userName || record.full_name,
        'Check-in Time': record.checkInTime || new Date(record.check_in_time).toLocaleString(),
        'Check-out Time': record.checkOutTime || (record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'),
        'Status': record.status || (record.check_out_time ? 'Checked Out' : 'Active'),
        'Duration': record.duration || ''
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${log.date} Logs`);
      XLSX.writeFile(wb, `${log.date}_DailyLogs.xlsx`);

      toast({
        title: "Success",
        description: "Excel file downloaded successfully",
      });
    } catch (error) {
      console.error('Error creating Excel file:', error);
      toast({
        title: "Error",
        description: "Failed to download Excel file",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `admin-files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('files')
        .insert([{
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          uploaded_by: "admin",
          description: fileDescription
        }]);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      fetchFiles();
      setShowFileUpload(false);
      setSelectedFile(null);
      setFileDescription("");
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const handleFileDelete = async (id: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const filteredData = data.filter(record => {
    const matchesName = !filters.fullName || record.full_name.toLowerCase().includes(filters.fullName.toLowerCase());
    const recordDate = new Date(record.check_in_time).toLocaleDateString('en-CA'); // YYYY-MM-DD
    const matchesDateFrom = !filters.dateFrom || recordDate >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || recordDate <= filters.dateTo;
    const matchesStatus = filters.status === "all" ||
      (filters.status === "active" && !record.check_out_time) ||
      (filters.status === "checked out" && record.check_out_time);

    return matchesName && matchesDateFrom && matchesDateTo && matchesStatus;
  });

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(record => ({
      'User Name': record.full_name,
      'Check-in Time': new Date(record.check_in_time).toLocaleString(),
      'Check-out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out',
      'Status': record.check_out_time ? 'Checked Out' : 'Active'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All CheckIns");
    XLSX.writeFile(wb, `all-checkins-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(filteredData.map(record => ({
      'User Name': record.full_name,
      'Check-in Time': new Date(record.check_in_time).toLocaleString(),
      'Check-out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out',
      'Status': record.check_out_time ? 'Checked Out' : 'Active'
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `all-checkins-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`All Check-Ins - ${new Date().toLocaleDateString()}`, 20, 20);

    let y = 40;
    filteredData.forEach((record, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const status = record.check_out_time ? 'Checked Out' : 'Active';
      doc.text(`${index + 1}. ${record.full_name} - Check-in: ${new Date(record.check_in_time).toLocaleString()} - Status: ${status}`, 20, y);
      y += 10;
    });

    doc.save(`all-checkins-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const saveTodaysLogs = async () => {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Fetch today's records
      const { data: todaysRecords, error } = await supabase
        .from('check_ins')
        .select('*')
        .gte('check_in_time', startOfDay.toISOString())
        .lt('check_in_time', endOfDay.toISOString())
        .order('check_in_time', { ascending: false });

      if (error) throw error;

      if (!todaysRecords || todaysRecords.length === 0) {
        toast({
          title: "No Records",
          description: "No check-in records found for today.",
          variant: "destructive",
        });
        return;
      }

      // Check completion - verify all employees have checked out
      const incompleteRecords = todaysRecords.filter(record => !record.check_out_time);
      if (incompleteRecords.length > 0) {
        toast({
          title: "Cannot Save Logs",
          description: `${incompleteRecords.length} employee(s) have not checked out yet. All employees must check out before saving logs.`,
          variant: "destructive",
        });
        return;
      }

      // Generate file name
      const dateStr = today.toISOString().split('T')[0];
      const monthStr = dateStr.slice(0, 7); // YYYY-MM
      const baseFileName = `${dateStr}_DailyLogs`;

      // Prepare data for different formats
      const logData = todaysRecords.map(record => ({
        userName: record.full_name,
        checkInTime: new Date(record.check_in_time).toLocaleString(),
        checkOutTime: record.check_out_time ? new Date(record.check_out_time).toLocaleString() : "Not checked out",
        status: record.check_out_time ? "Checked Out" : "Active",
        duration: record.check_out_time ?
          Math.round((new Date(record.check_out_time).getTime() - new Date(record.check_in_time).getTime()) / (1000 * 60)) + " minutes"
          : "Ongoing"
      }));

      // Store logs in localStorage for dashboard display
      const savedLogEntry = {
        id: Date.now(),
        date: dateStr,
        month: monthStr,
        totalRecords: todaysRecords.length,
        data: logData,
        jsonContent: JSON.stringify(logData, null, 2),
        csvContent: [
          ["User Name", "Check-in Time", "Check-out Time", "Status", "Duration"],
          ...logData.map(record => [
            record.userName,
            record.checkInTime,
            record.checkOutTime,
            record.status,
            record.duration
          ])
        ].map(row => row.join(",")).join("\n"),
        summaryContent: `Daily Check-In Logs - ${dateStr}

Total Records: ${todaysRecords.length}
All employees have successfully checked out.

${logData.map((record, index) =>
          `${index + 1}. ${record.userName}
     Check-in: ${record.checkInTime}
     Check-out: ${record.checkOutTime}
     Status: ${record.status}
     Duration: ${record.duration}

`).join('')}
Generated on: ${new Date().toLocaleString()}`,
        savedAt: new Date().toISOString()
      };

      saveLogsToStorage([savedLogEntry]);

      // Clear today's records from database to prepare for next day
      const { error: deleteError } = await supabase
        .from('check_ins')
        .delete()
        .gte('check_in_time', startOfDay.toISOString())
        .lt('check_in_time', endOfDay.toISOString());

      if (deleteError) {
        console.error('Error clearing records:', deleteError);
        toast({
          title: "Warning",
          description: "Logs saved but failed to clear today's records from database.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Today's logs saved successfully and stored in ${monthStr} container. Active logs cleared for tomorrow.`,
        });
        // Refresh data to show empty state
        fetchData();
        fetchActiveCheckIns();
      }

    } catch (error) {
      console.error('Error saving logs:', error);
      toast({
        title: "Error",
        description: "Failed to generate today's logs.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (record: CheckInRecord) => {
    console.log('handleEdit called with record:', record);
    try {
      const updateData: any = {
        full_name: record.full_name,
        check_in_time: record.check_in_time
      };

      // Only include check_out_time if it's not empty
      if (record.check_out_time && record.check_out_time.trim() !== '') {
        updateData.check_out_time = record.check_out_time;
      } else {
        updateData.check_out_time = null;
      }

      console.log('Updating record with data:', updateData);
      const { error } = await supabase
        .from('check_ins')
        .update(updateData)
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record updated successfully",
      });

      fetchData();
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from('check_ins')
        .insert([{
          full_name: newRecord.full_name,
          check_in_time: newRecord.check_in_time,
          check_out_time: newRecord.check_out_time || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record added successfully",
      });

      fetchData();
      setShowAddModal(false);
      setNewRecord({
        full_name: "",
        check_in_time: "",
        check_out_time: ""
      });
    } catch (error) {
      console.error('Error adding record:', error);
      toast({
        title: "Error",
        description: "Failed to add record",
        variant: "destructive",
      });
    }
  };

  const stats = {
    totalRecords: data.length,
    activeCheckIns: data.filter(record => !record.check_out_time && !record.checked_out).length,
    completedSessions: data.filter(record => record.check_out_time || record.checked_out).length,
    uniqueUsers: new Set(data.map(record => record.full_name)).size
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === filteredData.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredData.map(record => record.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedRecords.length} records? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .in('id', selectedRecords);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedRecords.length} records deleted successfully`,
      });

      fetchData();
      setSelectedRecords([]);
    } catch (error) {
      console.error('Error bulk deleting records:', error);
      toast({
        title: "Error",
        description: "Failed to delete records",
        variant: "destructive",
      });
    }
  };

  const handleBulkExport = () => {
    const selectedData = filteredData.filter(record => selectedRecords.includes(record.id));
    if (selectedData.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(selectedData.map(record => ({
      'User Name': record.full_name,
      'Check-in Time': new Date(record.check_in_time).toLocaleString(),
      'Check-out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out',
      'Status': record.check_out_time ? 'Checked Out' : 'Active'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected CheckIns");
    XLSX.writeFile(wb, `selected-checkins-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Success",
      description: `${selectedData.length} records exported successfully`,
    });
  };

  const getStatusBadge = (record: CheckInRecord) => {
    if (!record.check_out_time) {
      return <Badge className="bg-success/10 text-success border-primary hover:bg-success/20 transition-colors">Active</Badge>;
    } else {
      return <Badge className="bg-primary/10 text-primary border-primary hover:bg-primary/20 transition-colors">Checked Out</Badge>;
    }
  };

  const getFileTypeBadge = (fileType: string) => {
    const type = fileType?.split('/')[0] || 'unknown';
    const colors = {
      'image': 'bg-blue-500/10 text-blue-500 border-primary',
      'application': 'bg-purple-500/10 text-purple-500 border-primary',
      'text': 'bg-green-500/10 text-green-500 border-primary',
      'video': 'bg-red-500/10 text-red-500 border-primary',
      'audio': 'bg-yellow-500/10 text-yellow-500 border-primary',
      'unknown': 'bg-gray-500/10 text-gray-500 border-primary'
    };
    return <Badge className={`${colors[type as keyof typeof colors] || colors.unknown} hover:opacity-80 transition-opacity`}>{type}</Badge>;
  };

  const getFilePreview = (file: FileRecord) => {
    if (file.file_type?.startsWith('image/')) {
      const { data } = supabase.storage.from('files').getPublicUrl(file.file_path);
      return <img src={data.publicUrl} alt={file.file_name} className="w-8 h-8 object-cover rounded" />;
    } else {
      return <File className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const analyticsData = useMemo(() => {
    // Check-ins by day for the last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const checkInsByDay = last30Days.map(date => {
      const count = data.filter(record =>
        record.check_in_time.startsWith(date)
      ).length;
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        checkIns: count
      };
    });

    // Peak hours
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const checkInsByHour = hours.map(hour => {
      const count = data.filter(record => {
        const recordHour = new Date(record.check_in_time).getHours();
        return recordHour === hour;
      }).length;
      return {
        hour: `${hour}:00`,
        checkIns: count
      };
    });

    // File uploads by month
    const filesByMonth = files.reduce((acc, file) => {
      const month = new Date(file.uploaded_at).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const fileUploadsByMonth = Object.entries(filesByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        uploads: count
      }));

    return { checkInsByDay, checkInsByHour, fileUploadsByMonth };
  }, [data, files]);

  const dashboardFilteredData = useMemo(() => {
    return data.filter(record => {
      const matchesName = !dashboardFilters.fullName || record.full_name.toLowerCase().includes(dashboardFilters.fullName.toLowerCase());
      const recordDate = new Date(record.check_in_time).toISOString().split('T')[0];
      const matchesDateFrom = !dashboardFilters.dateFrom || recordDate >= dashboardFilters.dateFrom;
      const matchesDateTo = !dashboardFilters.dateTo || recordDate <= dashboardFilters.dateTo;

      return matchesName && matchesDateFrom && matchesDateTo;
    });
  }, [data, dashboardFilters]);

  const monthlyData = useMemo(() => {
    const monthGroups: { [key: string]: CheckInRecord[] } = {};
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    dashboardFilteredData.forEach(record => {
      const date = new Date(record.check_in_time);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
      monthGroups[monthKey].push(record);
    });

    const result: MonthlyData[] = Object.entries(monthGroups)
      .map(([monthKey, records]) => {
        const [year, month] = monthKey.split('-');
        const days: { [day: string]: CheckInRecord[] } = {};

        records.forEach(record => {
          const day = new Date(record.check_in_time).toISOString().split('T')[0];
          if (!days[day]) days[day] = [];
          days[day].push(record);
        });

        return {
          month: monthNames[parseInt(month) - 1],
          year: parseInt(year),
          days
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
      });

    // Set default selected month and day
    if (result.length > 0 && !selectedMonth) {
      setSelectedMonth(`${result[0].year}-${String(monthNames.indexOf(result[0].month) + 1).padStart(2, '0')}`);
      const firstDay = Object.keys(result[0].days)[0];
      if (firstDay) setSelectedDay(firstDay);
    }

    return result;
  }, [dashboardFilteredData, selectedMonth]);

  const selectedMonthData = monthlyData.find(m =>
    `${m.year}-${String(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(m.month) + 1).padStart(2, '0')}` === selectedMonth
  );

  const selectedDayRecords = selectedMonthData?.days[selectedDay] || [];

  const dashboardAnalyticsData = useMemo(() => {
    if (!selectedMonthData) return { checkInsByDay: [] };

    const dayCount: { [key: string]: number } = {};

    Object.values(selectedMonthData.days).flat().forEach(record => {
      const day = new Date(record.check_in_time).getDate();
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    const checkInsByDay = Object.entries(dayCount).map(([day, count]) => ({
      day: `${day}`,
      checkIns: count
    }));

    return { checkInsByDay };
  }, [selectedMonthData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading admin dashboard...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading text-foreground">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Full administrative access to all check-in records
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              <LogoutIcon className="w-4 h-4 mr-2 text-primary" />
              Logout
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-card shadow-card rounded-[7px] hover:shadow-elevation transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-[7px] flex items-center justify-center transition-colors hover:bg-primary/20">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-heading text-foreground">{stats.totalRecords}</p>
                  <p className="text-xs text-muted-foreground mt-1">↗ +12% this week</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-card rounded-[7px] hover:shadow-elevation transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success/10 rounded-[7px] flex items-center justify-center transition-colors hover:bg-success/20">
                  <CheckInIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Check-Ins</p>
                  <p className="text-2xl font-heading text-foreground">{stats.activeCheckIns}</p>
                  <p className="text-xs text-muted-foreground mt-1">↗ +8% today</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-card rounded-[7px] hover:shadow-elevation transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-[7px] flex items-center justify-center transition-colors hover:bg-destructive/20">
                  <TrendingUp className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Sessions</p>
                  <p className="text-2xl font-heading text-foreground">{stats.completedSessions}</p>
                  <p className="text-xs text-muted-foreground mt-1">↗ +15% this month</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card shadow-card rounded-[7px] hover:shadow-elevation transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-[7px] flex items-center justify-center transition-colors hover:bg-accent/20">
                  <Users className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
                  <p className="text-2xl font-heading text-foreground">{stats.uniqueUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">↗ +5% this week</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Filter className="w-4 h-4" />
              <span className="font-medium text-sm sm:text-base">Filters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Input
                placeholder="Filter by name"
                value={filters.fullName}
                onChange={(e) => setFilters(prev => ({ ...prev, fullName: e.target.value }))}
                className="text-sm sm:text-base"
              />
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="checked out">Checked Out</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="From date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="text-sm sm:text-base"
              />
              <Input
                type="date"
                placeholder="To date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="text-sm sm:text-base"
              />
            </div>
          </Card>

          <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 transition-all duration-300 h-auto p-1">
              <TabsTrigger value="dashboard" className="transition-all duration-200 text-xs sm:text-sm">Dashboard</TabsTrigger>
              <TabsTrigger value="records" className="transition-all duration-200 text-xs sm:text-sm">Records</TabsTrigger>
              <TabsTrigger value="files" className="transition-all duration-200 text-xs sm:text-sm">Files</TabsTrigger>
              <TabsTrigger value="analytics" className="transition-all duration-200 text-xs sm:text-sm">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 transition-all duration-300">
              <Collapsible open={!isRecordsCollapsed} onOpenChange={setIsRecordsCollapsed}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 hover:bg-muted/50 transition-colors">
                    <span className="font-heading">Dashboard Overview</span>
                    {isRecordsCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 sm:space-y-6 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    {/* Sidebar */}
                    <div className="w-full lg:w-64 space-y-4">
                      <Card className="p-3 sm:p-4">
                        <h3 className="font-heading mb-3 sm:mb-4 text-sm sm:text-base">Months</h3>
                        <div className="space-y-2 max-h-64 lg:max-h-96 overflow-y-auto">
                          {monthlyData.map((month) => (
                            <button
                              key={`${month.year}-${month.month}`}
                              onClick={() => {
                                const monthKey = `${month.year}-${String(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month.month) + 1).padStart(2, '0')}`;
                                setSelectedMonth(monthKey);
                                const firstDay = Object.keys(month.days)[0];
                                if (firstDay) setSelectedDay(firstDay);
                              }}
                              className={cn(
                                "w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm",
                                selectedMonth === `${month.year}-${String(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month.month) + 1).padStart(2, '0')}` && "bg-primary text-primary-foreground"
                              )}
                            >
                              📁 {month.month} {month.year}
                            </button>
                          ))}
                        </div>
                      </Card>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 space-y-4 sm:space-y-6">
                      {/* Header */}
                      <div>
                        <h2 className="text-2xl font-heading text-foreground">Dashboard</h2>
                        <p className="text-muted-foreground mt-1">
                          Manage and analyze check-in records
                        </p>
                      </div>

                      {/* Filters */}
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Filter className="w-4 h-4" />
                          <span className="font-medium">Filters</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            placeholder="Filter by name"
                            value={dashboardFilters.fullName}
                            onChange={(e) => setDashboardFilters(prev => ({ ...prev, fullName: e.target.value }))}
                          />
                          <Input
                            type="date"
                            placeholder="From date"
                            value={dashboardFilters.dateFrom}
                            onChange={(e) => setDashboardFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                          />
                          <Input
                            type="date"
                            placeholder="To date"
                            value={dashboardFilters.dateTo}
                            onChange={(e) => setDashboardFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                          />
                        </div>
                      </Card>

                      {selectedMonthData && (
                        <>
                          {/* Days List */}
                          <Card className="p-4">
                            <h3 className="font-heading mb-4">📅 {selectedMonthData.month} {selectedMonthData.year} - Days</h3>
                            <div className="grid grid-cols-7 gap-2">
                              {Object.entries(selectedMonthData.days).map(([day, records]) => (
                                <button
                                  key={day}
                                  onClick={() => setSelectedDay(day)}
                                  className={cn(
                                    "p-2 text-center rounded hover:bg-muted transition-colors",
                                    selectedDay === day && "bg-primary text-primary-foreground"
                                  )}
                                >
                                  <div className="text-sm font-heading">{new Date(day).getDate()}</div>
                                  <div className="text-xs">{records.length} records</div>
                                </button>
                              ))}
                            </div>
                          </Card>

                          {/* Records Table */}
                          <Card className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-heading">📄 Records for {selectedDay}</h3>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                  const ws = XLSX.utils.json_to_sheet(selectedDayRecords.map(record => ({
                                    'Full Name': record.full_name,
                                    'Check In Time': new Date(record.check_in_time).toLocaleString(),
                                    'Check Out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'
                                  })));
                                  const wb = XLSX.utils.book_new();
                                  XLSX.utils.book_append_sheet(wb, ws, "CheckIns");
                                  XLSX.writeFile(wb, `checkins-${selectedDay}.xlsx`);
                                }}>
                                  <Download className="w-4 h-4 mr-1" />
                                  Excel
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                  const csv = Papa.unparse(selectedDayRecords.map(record => ({
                                    'Full Name': record.full_name,
                                    'Check In Time': new Date(record.check_in_time).toLocaleString(),
                                    'Check Out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'
                                  })));
                                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                  const link = document.createElement('a');
                                  link.href = URL.createObjectURL(blob);
                                  link.download = `checkins-${selectedDay}.csv`;
                                  link.click();
                                }}>
                                  <Download className="w-4 h-4 mr-1" />
                                  CSV
                                </Button>
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                  <TableRow>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Check In</TableHead>
                                    <TableHead>Check Out</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedDayRecords.map((record) => (
                                    <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                                      <TableCell>{record.full_name}</TableCell>
                                      <TableCell>{new Date(record.check_in_time).toLocaleString()}</TableCell>
                                      <TableCell>
                                        {record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </Card>

                          {/* Analytics */}
                          <Card className="p-4">
                            <h3 className="font-heading mb-4">Check-Ins by Day</h3>
                            <ChartContainer config={{}} className="h-64">
                              <BarChart data={dashboardAnalyticsData.checkInsByDay}>
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Bar dataKey="checkIns" fill="#8884d8" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                              </BarChart>
                            </ChartContainer>
                          </Card>

                          {/* Active Check-Ins Section */}
                          <Card className="p-4">
                            <h3 className="font-heading mb-4">Active Check-Ins Today ({activeCheckIns.length})</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {activeCheckIns.map((checkIn) => (
                                <div key={checkIn.id} className="flex items-center justify-between p-3 border rounded-[7px] hover:bg-muted/50 transition-colors">
                                  <div className="flex-1">
                                    <div className="font-heading text-sm">{checkIn.full_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Checked in: {new Date(checkIn.check_in_time).toLocaleTimeString()}
                                    </div>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleIndividualCheckout(checkIn.id)}
                                    className="hover:bg-red-600 transition-colors"
                                  >
                                    <LogOut className="w-4 h-4 mr-1" />
                                    Check Out
                                  </Button>
                                </div>
                              ))}
                              {activeCheckIns.length === 0 && (
                                <div className="text-center text-muted-foreground py-4">
                                  No active check-ins for today. All employees have checked out.
                                </div>
                              )}
                            </div>
                          </Card>

                          {/* Saved Logs Section */}
                          <Card className="p-4">
                            <h3 className="font-heading mb-4">Saved Daily Logs</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {(() => {
                                // Group saved logs by month
                                const groupedLogs = savedLogs.reduce((acc, log) => {
                                  if (!acc[log.month]) acc[log.month] = [];
                                  acc[log.month].push(log);
                                  return acc;
                                }, {} as Record<string, any[]>);

                                const sortedMonths = Object.keys(groupedLogs).sort().reverse();

                                return sortedMonths.flatMap(month => [
                                  <div key={`month-${month}`} className="font-bold bg-muted text-center py-2 rounded">
                                    {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                                  </div>,
                                  ...groupedLogs[month].map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-[7px] hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleViewSavedLog(log)}>
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{log.date} Daily Logs</div>
                                        <div className="text-xs text-muted-foreground">
                                          {log.total_records} records • {new Date(log.saved_at).toLocaleDateString()}
                                        </div>
                                      </div>
                                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => downloadSavedLogAsExcel(log)}
                                          className="text-xs"
                                          title="Download Excel"
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          Excel
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const blob = new Blob([log.json_content], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${log.date}_DailyLogs.json`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                          }}
                                          className="text-xs"
                                          title="Download JSON"
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          JSON
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const blob = new Blob([log.csv_content], { type: 'text/csv' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${log.date}_DailyLogs.csv`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                          }}
                                          className="text-xs"
                                          title="Download CSV"
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          CSV
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const blob = new Blob([log.summary_content], { type: 'text/plain' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${log.date}_DailyLogs_Summary.txt`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                          }}
                                          className="text-xs"
                                          title="Download Summary"
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          Summary
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => handleDeleteSavedLog(log.id)}
                                          className="text-xs"
                                          title="Delete Log"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleRestoreSavedLog(log)}
                                          className="text-xs"
                                          title="Restore to Active Records"
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                ]);
                              })()}
                              {savedLogs.length === 0 && (
                                <div className="text-center text-muted-foreground py-4">
                                  No saved daily logs yet. Use "Save Logs" to archive today's records.
                                </div>
                              )}
                            </div>
                          </Card>
                        </>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="records" className="space-y-6 transition-all duration-300">
              <Collapsible open={!isRecordsCollapsed} onOpenChange={setIsRecordsCollapsed}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 hover:bg-muted/50 transition-colors">
                    <span className="font-semibold">Check-In Records Management</span>
                    {isRecordsCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-6 transition-all duration-300">
                  {/* Records Table */}
                  <Card className="p-3 sm:p-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-3 sm:mb-4 gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <h3 className="font-semibold text-sm sm:text-base">All Check-In Records ({filteredData.length})</h3>
                        {selectedRecords.length > 0 && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <span className="text-xs sm:text-sm text-muted-foreground">{selectedRecords.length} selected</span>
                            <div className="flex gap-2">
                              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="text-xs sm:text-sm">
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Delete
                              </Button>
                              <Button variant="outline" size="sm" onClick={handleBulkExport} className="text-xs sm:text-sm">
                                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Export
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <Button variant="default" size="sm" onClick={() => setShowAddModal(true)} className="text-xs sm:text-sm flex-1 sm:flex-none">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Add Record
                        </Button>
                        <Button variant="outline" size="sm" onClick={saveTodaysLogs} className="text-xs sm:text-sm flex-1 sm:flex-none">
                          <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Save Logs
                        </Button>
                        <div className="flex gap-1 flex-1 sm:flex-none">
                          <Button variant="outline" size="sm" onClick={exportToExcel} className="text-xs sm:text-sm flex-1">
                            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Excel
                          </Button>
                          <Button variant="outline" size="sm" onClick={exportToCSV} className="text-xs sm:text-sm flex-1">
                            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            CSV
                          </Button>
                          <Button variant="outline" size="sm" onClick={exportToPDF} className="text-xs sm:text-sm flex-1">
                            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="w-10 sm:w-12">
                              <Checkbox
                                checked={selectedRecords.length === filteredData.length && filteredData.length > 0}
                                onCheckedChange={handleSelectAll}
                                className="scale-75 sm:scale-100"
                              />
                            </TableHead>
                            <TableHead className="min-w-[120px]">Full Name</TableHead>
                            <TableHead className="min-w-[140px] hidden sm:table-cell">Check In</TableHead>
                            <TableHead className="min-w-[140px] hidden md:table-cell">Check Out</TableHead>
                            <TableHead className="min-w-[80px]">Status</TableHead>
                            <TableHead className="min-w-[120px] hidden lg:table-cell">Created</TableHead>
                            <TableHead className="min-w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.map((record) => (
                            <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell>
                                <Checkbox
                                  checked={selectedRecords.includes(record.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRecords(prev => [...prev, record.id]);
                                    } else {
                                      setSelectedRecords(prev => prev.filter(id => id !== record.id));
                                    }
                                  }}
                                  className="scale-75 sm:scale-100"
                                />
                              </TableCell>
                              <TableCell className="font-medium text-sm sm:text-base">
                                <div>
                                  <div>{record.full_name}</div>
                                  <div className="text-xs text-muted-foreground sm:hidden">
                                    {new Date(record.check_in_time).toLocaleDateString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                                {new Date(record.check_in_time).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                                {record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'}
                              </TableCell>
                              <TableCell>{getStatusBadge(record)}</TableCell>
                              <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                                {new Date(record.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      console.log('Edit button clicked for record:', record);
                                      setEditingRecord(record);
                                    }}
                                    className="hover:bg-primary/10 transition-colors p-1 sm:p-2"
                                  >
                                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(record.id)}
                                    className="hover:bg-destructive/10 transition-colors p-1 sm:p-2"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="files" className="space-y-6 transition-all duration-300">
              <Collapsible open={!isFilesCollapsed} onOpenChange={setIsFilesCollapsed}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 hover:bg-muted/50 transition-colors">
                    <span className="font-semibold">File Management</span>
                    {isFilesCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-6 transition-all duration-300">
                  {/* File Management */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">File Management ({files.length + savedLogs.length} items)</h3>
                      <Button variant="default" size="sm" onClick={() => setShowFileUpload(true)}>
                        <Upload className="w-4 h-4 mr-1" />
                        Upload File
                      </Button>
                    </div>
                    <div className="mb-4">
                      <Input
                        placeholder="Search files by name or type..."
                        value={fileSearch}
                        onChange={(e) => setFileSearch(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead>Preview</TableHead>
                            <TableHead>File Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            // Combine regular files and saved logs
                            const allItems = [
                              ...files.map(file => ({ ...file, type: 'file' })),
                              ...savedLogs.map(log => ({
                                id: `log-${log.id}`,
                                file_name: `${log.date}_DailyLogs`,
                                file_type: 'application/json',
                                file_size: new Blob([log.json_content]).size,
                                uploaded_at: log.saved_at,
                                description: `Daily logs for ${log.date} - ${log.total_records} records`,
                                type: 'log',
                                logData: log
                              }))
                            ];

                            const filteredItems = allItems.filter(item =>
                              item.file_name.toLowerCase().includes(fileSearch.toLowerCase()) ||
                              (item.file_type && item.file_type.toLowerCase().includes(fileSearch.toLowerCase())) ||
                              (item.description && item.description.toLowerCase().includes(fileSearch.toLowerCase()))
                            );

                            const groupedItems = filteredItems.reduce((acc, item) => {
                              const month = new Date(item.uploaded_at).toISOString().slice(0, 7); // YYYY-MM
                              if (!acc[month]) acc[month] = [];
                              acc[month].push(item);
                              return acc;
                            }, {} as Record<string, any[]>);

                            const sortedMonths = Object.keys(groupedItems).sort().reverse();

                            return sortedMonths.flatMap(month => [
                              <TableRow key={`month-${month}`}>
                                <TableCell colSpan={7} className="font-bold bg-primary/10 text-center py-3 hover:bg-primary/20 transition-colors">
                                  📁 {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} ({groupedItems[month].length} items)
                                </TableCell>
                              </TableRow>,
                              ...groupedItems[month].map((item) => (
                                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                                  <TableCell>
                                    {item.type === 'log' ? (
                                      <Save className="w-8 h-8 text-success" />
                                    ) : (
                                      getFilePreview(item)
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {item.file_name}
                                    {item.type === 'log' && (
                                      <Badge className="ml-2 bg-success/10 text-success border-primary">Daily Log</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>{getFileTypeBadge(item.file_type)}</TableCell>
                                  <TableCell>{item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : 'Unknown'}</TableCell>
                                  <TableCell>{new Date(item.uploaded_at).toLocaleString()}</TableCell>
                                  <TableCell>{item.description || 'No description'}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      {item.type === 'log' ? (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const blob = new Blob([item.logData.json_content], { type: 'application/json' });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `${item.logData.date}_DailyLogs.json`;
                                              document.body.appendChild(a);
                                              a.click();
                                              document.body.removeChild(a);
                                              URL.revokeObjectURL(url);
                                            }}
                                            className="hover:bg-primary/10 transition-colors"
                                            title="Download JSON"
                                          >
                                            <Download className="w-4 h-4" />
                                            JSON
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const blob = new Blob([item.logData.csv_content], { type: 'text/csv' });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `${item.logData.date}_DailyLogs.csv`;
                                              document.body.appendChild(a);
                                              a.click();
                                              document.body.removeChild(a);
                                              URL.revokeObjectURL(url);
                                            }}
                                            className="hover:bg-primary/10 transition-colors"
                                            title="Download CSV"
                                          >
                                            <Download className="w-4 h-4" />
                                            CSV
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const blob = new Blob([item.logData.summary_content], { type: 'text/plain' });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `${item.logData.date}_DailyLogs_Summary.txt`;
                                              document.body.appendChild(a);
                                              a.click();
                                              document.body.removeChild(a);
                                              URL.revokeObjectURL(url);
                                            }}
                                            className="hover:bg-primary/10 transition-colors"
                                            title="Download Summary"
                                          >
                                            <Download className="w-4 h-4" />
                                            Summary
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => downloadFile(item.file_path, item.file_name)}
                                            className="hover:bg-primary/10 transition-colors"
                                            title="Download File"
                                          >
                                            <Download className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleFileDelete(item.id, item.file_path)}
                                            className="hover:bg-destructive/10 transition-colors"
                                            title="Delete File"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ]);
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 transition-all duration-300">
              <Collapsible open={!isFilesCollapsed} onOpenChange={setIsFilesCollapsed}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 hover:bg-muted/50 transition-colors">
                    <span className="font-semibold">Analytics Dashboard</span>
                    {isFilesCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-6 transition-all duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                      <h3 className="font-semibold mb-4">Check-Ins Over Last 30 Days</h3>
                      <ChartContainer config={{}} className="h-64">
                        <LineChart data={analyticsData.checkInsByDay}>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Line type="monotone" dataKey="checkIns" stroke="#8884d8" strokeWidth={2} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </LineChart>
                      </ChartContainer>
                    </Card>

                    <Card className="p-6">
                      <h3 className="font-semibold mb-4">Check-Ins by Hour of Day</h3>
                      <ChartContainer config={{}} className="h-64">
                        <BarChart data={analyticsData.checkInsByHour}>
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Bar dataKey="checkIns" fill="#82ca9d" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </BarChart>
                      </ChartContainer>
                    </Card>

                    <Card className="p-6 lg:col-span-2">
                      <h3 className="font-semibold mb-4">File Uploads by Month</h3>
                      <ChartContainer config={{}} className="h-64">
                        <BarChart data={analyticsData.fileUploadsByMonth}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Bar dataKey="uploads" fill="#ffc658" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </BarChart>
                      </ChartContainer>
                    </Card>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog
        open={!!editingRecord}
        onOpenChange={(open) => {
          console.log('Dialog open state changing to:', open);
          if (!open) setEditingRecord(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input
                  value={editingRecord.full_name}
                  onChange={(e) => setEditingRecord({ ...editingRecord, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check In Time</label>
                <Input
                  type="datetime-local"
                  value={new Date(editingRecord.check_in_time).toISOString().slice(0, 16)}
                  onChange={(e) => setEditingRecord({ ...editingRecord, check_in_time: new Date(e.target.value).toISOString() })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check Out Time (optional)</label>
                <Input
                  type="datetime-local"
                  value={editingRecord.check_out_time ? new Date(editingRecord.check_out_time).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditingRecord({
                    ...editingRecord,
                    check_out_time: e.target.value ? new Date(e.target.value).toISOString() : null
                  })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleEdit(editingRecord)}>Save Changes</Button>
                <Button variant="outline" onClick={() => setEditingRecord(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <Input
                value={newRecord.full_name}
                onChange={(e) => setNewRecord({ ...newRecord, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check In Time</label>
              <Input
                type="datetime-local"
                value={newRecord.check_in_time}
                onChange={(e) => setNewRecord({ ...newRecord, check_in_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check Out Time (optional)</label>
              <Input
                type="datetime-local"
                value={newRecord.check_out_time}
                onChange={(e) => setNewRecord({ ...newRecord, check_out_time: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!newRecord.full_name || !newRecord.check_in_time}>
                Add Record
              </Button>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload Modal */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Upload a file to the admin storage for management.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select or Drag & Drop File</label>
              <div
                className={`border-2 border-dashed rounded-[7px] p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    setSelectedFile(files[0]);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <File className="w-8 h-8 mx-auto text-primary" />
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm">Drop files here or click to browse</p>
                  </div>
                )}
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept="*/*"
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <Textarea
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Enter file description"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFileUpload} disabled={!selectedFile}>
                Upload File
              </Button>
              <Button variant="outline" onClick={() => setShowFileUpload(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Log Details Modal */}
      <Dialog open={showSavedLogModal} onOpenChange={setShowSavedLogModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedSavedLog?.date} Daily Logs</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedSavedLog && downloadSavedLogAsExcel(selectedSavedLog)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedSavedLog) {
                      const blob = new Blob([selectedSavedLog.json_content], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedSavedLog.date}_DailyLogs.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedSavedLog) {
                      const blob = new Blob([selectedSavedLog.csv_content], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedSavedLog.date}_DailyLogs.csv`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (selectedSavedLog) {
                      handleDeleteSavedLog(selectedSavedLog.id);
                      setShowSavedLogModal(false);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedSavedLog) {
                      handleRestoreSavedLog(selectedSavedLog);
                      setShowSavedLogModal(false);
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Restore
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              {selectedSavedLog?.total_records} records • Saved on {selectedSavedLog ? new Date(selectedSavedLog.saved_at).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedSavedLog && (
            <div className="space-y-6">
              {/* Summary */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Summary</h3>
                <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                  {selectedSavedLog.summary_content}
                </div>
              </Card>

              {/* Records Table */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Detailed Records</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        <TableHead>Check-out Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        try {
                          const logData = typeof selectedSavedLog.log_data === 'string'
                            ? JSON.parse(selectedSavedLog.log_data)
                            : selectedSavedLog.log_data;

                          return logData.map((record: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {record.userName || record.full_name}
                              </TableCell>
                              <TableCell>
                                {record.checkInTime || new Date(record.check_in_time).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {record.checkOutTime || (record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out')}
                              </TableCell>
                              <TableCell>
                                <Badge variant={record.checkOutTime || record.check_out_time ? "default" : "secondary"}>
                                  {record.status || (record.check_out_time ? 'Checked Out' : 'Active')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {record.duration || ''}
                              </TableCell>
                            </TableRow>
                          ));
                        } catch (error) {
                          return (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                Error parsing log data
                              </TableCell>
                            </TableRow>
                          );
                        }
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}