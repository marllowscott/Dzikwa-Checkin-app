import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Calendar, Users, TrendingUp, Loader2, Download, Edit, Trash2, Plus, Filter, LogOut, FileText, Upload, Eye, File, Save, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight, Home, RefreshCw, Video, Music } from "lucide-react";
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

  // Employee management state
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    full_name: "",
    email: "",
    department: ""
  });
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  // Guest management state
  const [guests, setGuests] = useState<any[]>([]);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [newGuest, setNewGuest] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    purpose: ""
  });
  const [editingGuest, setEditingGuest] = useState<any>(null);

  // Guest check-ins state
  const [guestCheckIns, setGuestCheckIns] = useState<any[]>([]);
  const [loadingGuestCheckIns, setLoadingGuestCheckIns] = useState(false);

  // Child check-ins state
  const [childCheckIns, setChildCheckIns] = useState<any[]>([]);
  const [loadingChildCheckIns, setLoadingChildCheckIns] = useState(false);

  // Dashboard data state
  const [stats, setStats] = useState({
    totalRecords: 0,
    activeCheckIns: 0,
    completedSessions: 0,
    uniqueUsers: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [selectedMonthData, setSelectedMonthData] = useState<MonthlyData | null>(null);
  const [selectedDayRecords, setSelectedDayRecords] = useState<CheckInRecord[]>([]);
  const [dashboardAnalyticsData, setDashboardAnalyticsData] = useState({
    checkInsByDay: []
  });
  const [analyticsData, setAnalyticsData] = useState({
    checkInsByDay: [],
    checkInsByHour: [],
    fileUploadsByMonth: []
  });
  const [filteredData, setFilteredData] = useState<CheckInRecord[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Employee Management Functions
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.full_name.trim()) {
      toast({
        title: "Error",
        description: "Employee name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          full_name: newEmployee.full_name.trim(),
          email: newEmployee.email.trim() || null,
          department: newEmployee.department.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Add user role
      await supabase
        .from('user_roles')
        .insert({
          user_id: data.id,
          role: 'employee'
        });

      toast({
        title: "Success",
        description: `${data.full_name} has been added successfully`,
      });

      // Reset form and refresh
      setNewEmployee({ full_name: "", email: "", department: "" });
      setShowAddEmployeeModal(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          full_name: editingEmployee.full_name.trim(),
          email: editingEmployee.email?.trim() || null,
          department: editingEmployee.department?.trim() || null,
          is_active: editingEmployee.is_active
        })
        .eq('id', editingEmployee.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee updated successfully",
      });

      setEditingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) return;

    try {
      // Delete user role first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', employeeId);

      // Then delete employee
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${employeeName} has been deleted`,
      });

      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  // Guest Management Functions
  const fetchGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  };

  const handleAddGuest = async () => {
    if (!newGuest.full_name.trim()) {
      toast({
        title: "Error",
        description: "Guest name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('guests')
        .insert({
          full_name: newGuest.full_name.trim(),
          email: newGuest.email.trim() || null,
          phone: newGuest.phone.trim() || null,
          company: newGuest.company.trim() || null,
          purpose: newGuest.purpose.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${data.full_name} has been added as a guest`,
      });

      setNewGuest({ full_name: "", email: "", phone: "", company: "", purpose: "" });
      setShowAddGuestModal(false);
      fetchGuests();
    } catch (error) {
      console.error('Error adding guest:', error);
      toast({
        title: "Error",
        description: "Failed to add guest",
        variant: "destructive",
      });
    }
  };

  const handleEditGuest = async () => {
    if (!editingGuest || !editingGuest.full_name.trim()) {
      toast({
        title: "Error",
        description: "Guest name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('guests')
        .update({
          full_name: editingGuest.full_name.trim(),
          email: editingGuest.email?.trim() || null,
          phone: editingGuest.phone?.trim() || null,
          company: editingGuest.company?.trim() || null,
          purpose: editingGuest.purpose?.trim() || null,
          is_active: editingGuest.is_active
        })
        .eq('id', editingGuest.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${editingGuest.full_name} has been updated`,
      });

      setEditingGuest(null);
      fetchGuests();
    } catch (error) {
      console.error('Error updating guest:', error);
      toast({
        title: "Error",
        description: "Failed to update guest",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGuest = async (guestId: string, guestName: string) => {
    if (!confirm(`Are you sure you want to delete ${guestName}? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${guestName} has been deleted`,
      });

      fetchGuests();
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast({
        title: "Error",
        description: "Failed to delete guest",
        variant: "destructive",
      });
    }
  };

  // Guest Check-in Functions
  const fetchGuestCheckIns = async () => {
    setLoadingGuestCheckIns(true);
    try {
      const { data, error } = await supabase
        .from('guest_check_ins')
        .select('*, guests(full_name, email, company)')
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setGuestCheckIns(data || []);
    } catch (error) {
      console.error('Error fetching guest check-ins:', error);
    } finally {
      setLoadingGuestCheckIns(false);
    }
  };

  const handleGuestCheckOut = async (checkInId: string, guestName: string) => {
    try {
      const { error } = await supabase
        .from('guest_check_ins')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', checkInId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${guestName} has been checked out`,
      });

      fetchGuestCheckIns();
    } catch (error) {
      console.error('Error checking out guest:', error);
      toast({
        title: "Error",
        description: "Failed to check out guest",
        variant: "destructive",
      });
    }
  };

  // Child Check-in Functions
  const fetchChildCheckIns = async () => {
    setLoadingChildCheckIns(true);
    try {
      const { data, error } = await supabase
        .from('child_check_ins')
        .select('*, dzikwa_children(full_name, parent_name, grade)')
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setChildCheckIns(data || []);
    } catch (error) {
      console.error('Error fetching child check-ins:', error);
    } finally {
      setLoadingChildCheckIns(false);
    }
  };

  // Main data fetching functions
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setData(data || []);
      setFilteredData(data || []);
    } catch (error) {
      console.error('Error fetching check-in records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch check-in records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const loadSavedLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_logs')
        .select('*')
        .order('saved_at', { ascending: false });

      if (error) throw error;
      setSavedLogs(data || []);
    } catch (error) {
      console.error('Error loading saved logs:', error);
    }
  };

  const fetchActiveCheckIns = async () => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setActiveCheckIns(data || []);
    } catch (error) {
      console.error('Error fetching active check-ins:', error);
    }
  };

  const handleChildCheckOut = async (checkInId: string, childName: string) => {
    try {
      const { error } = await supabase
        .from('child_check_ins')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', checkInId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${childName} has been checked out`,
      });

      fetchChildCheckIns();
    } catch (error) {
      console.error('Error checking out child:', error);
      toast({
        title: "Error",
        description: "Failed to check out child",
        variant: "destructive",
      });
    }
  };

  // Navigation and utility functions
  const handleBackToMain = () => {
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdmin');
    navigate('/admin-login');
  };

  const handleIndividualCheckout = async (checkInId: string) => {
    try {
      const record = activeCheckIns.find(checkIn => checkIn.id === checkInId);
      if (!record) return;

      const { error } = await supabase
        .from('check_ins')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', checkInId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${record.full_name} has been checked out`,
      });

      fetchActiveCheckIns();
      fetchData();
    } catch (error) {
      console.error('Error checking out:', error);
      toast({
        title: "Error",
        description: "Failed to check out",
        variant: "destructive",
      });
    }
  };

  const handleViewSavedLog = (log: SavedLog) => {
    setSelectedSavedLog(log);
    setShowSavedLogModal(true);
  };

  // Export functions
  const downloadSavedLogAsExcel = (log: SavedLog) => {
    try {
      const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;
      const ws = XLSX.utils.json_to_sheet(logData.map((record: any) => ({
        'Full Name': record.userName || record.full_name,
        'Check In Time': record.checkInTime || record.check_in_time,
        'Check Out Time': record.checkOutTime || record.check_out_time || 'Not checked out'
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DailyLogs");
      XLSX.writeFile(wb, `${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}_DailyLogs.xlsx`);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast({
        title: "Error",
        description: "Failed to download Excel file",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(record => ({
      'Full Name': record.full_name,
      'Check In Time': new Date(record.check_in_time).toLocaleString(),
      'Check Out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CheckIns");
    XLSX.writeFile(wb, `checkins_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(filteredData.map(record => ({
      'Full Name': record.full_name,
      'Check In Time': new Date(record.check_in_time).toLocaleString(),
      'Check Out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `checkins_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Check-In Records', 20, 20);
    doc.text(`Total Records: ${filteredData.length}`, 20, 30);

    let y = 50;
    filteredData.forEach((record, index) => {
      doc.text(`${index + 1}. ${record.full_name}`, 20, y);
      doc.text(`Check-in: ${new Date(record.check_in_time).toLocaleString()}`, 30, y + 7);
      doc.text(`Check-out: ${record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'}`, 30, y + 14);
      y += 25;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`checkins_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Record CRUD operations
  const handleAdd = async () => {
    if (!newRecord.full_name.trim() || !newRecord.check_in_time) {
      toast({
        title: "Error",
        description: "Full name and check-in time are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          full_name: newRecord.full_name.trim(),
          check_in_time: new Date(newRecord.check_in_time).toISOString(),
          check_out_time: newRecord.check_out_time ? new Date(newRecord.check_out_time).toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record added successfully",
      });

      setNewRecord({ full_name: "", check_in_time: "", check_out_time: "" });
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding record:', error);
      toast({
        title: "Error",
        description: "Failed to add record",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (record: CheckInRecord) => {
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({
          full_name: record.full_name,
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time
        })
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record updated successfully",
      });

      setEditingRecord(null);
      fetchData();
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('check_ins')
        .delete()
        .eq('id', recordId);

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

  // Bulk operations
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

      setSelectedRecords([]);
      fetchData();
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
    const selectedData = data.filter(record => selectedRecords.includes(record.id));
    const ws = XLSX.utils.json_to_sheet(selectedData.map(record => ({
      'Full Name': record.full_name,
      'Check In Time': new Date(record.check_in_time).toLocaleString(),
      'Check Out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SelectedCheckIns");
    XLSX.writeFile(wb, `selected_checkins_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredData.map(record => record.id));
    } else {
      setSelectedRecords([]);
    }
  };

  // Saved logs operations
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
    try {
      const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.log_data;

      const records = logData.map((record: any) => ({
        full_name: record.userName || record.full_name,
        check_in_time: record.checkInTime || record.check_in_time,
        check_out_time: record.checkOutTime || record.check_out_time || null
      }));

      const { error } = await supabase
        .from('check_ins')
        .insert(records);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${records.length} records restored successfully`,
      });

      fetchData();
    } catch (error) {
      console.error('Error restoring saved log:', error);
      toast({
        title: "Error",
        description: "Failed to restore saved log",
        variant: "destructive",
      });
    }
  };

  // Save today's logs
  const saveTodaysLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaysRecords = data.filter(record =>
        new Date(record.check_in_time).toISOString().split('T')[0] === today
      );

      if (todaysRecords.length === 0) {
        toast({
          title: "No Records",
          description: "No records found for today",
          variant: "destructive",
        });
        return;
      }

      const summary = `Total records: ${todaysRecords.length}\nChecked in: ${todaysRecords.filter(r => !r.check_out_time).length}\nChecked out: ${todaysRecords.filter(r => r.check_out_time).length}`;

      const { error } = await supabase
        .from('saved_logs')
        .insert({
          date: today,
          total_records: todaysRecords.length,
          log_data: todaysRecords,
          json_content: JSON.stringify(todaysRecords, null, 2),
          csv_content: Papa.unparse(todaysRecords),
          summary_content: summary
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Today's ${todaysRecords.length} records saved successfully`,
      });

      loadSavedLogs();
    } catch (error) {
      console.error('Error saving logs:', error);
      toast({
        title: "Error",
        description: "Failed to save today's logs",
        variant: "destructive",
      });
    }
  };

  // File operations
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

  const handleFileDelete = async (fileId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) return;

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
        .eq('id', fileId);

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

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `admin/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('files')
        .insert({
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          description: fileDescription || null
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      setSelectedFile(null);
      setFileDescription("");
      setShowFileUpload(false);
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  // Utility functions
  const getStatusBadge = (record: CheckInRecord) => {
    if (record.check_out_time) {
      return <Badge variant="default">Checked Out</Badge>;
    }
    return <Badge variant="secondary">Active</Badge>;
  };

  const getFilePreview = (file: FileRecord) => {
    const type = file.file_type?.split('/')[0];
    switch (type) {
      case 'image':
        return <img src={supabase.storage.from('files').getPublicUrl(file.file_path).data.publicUrl} alt={file.file_name} className="w-8 h-8 object-cover rounded" />;
      case 'video':
        return <Video className="w-8 h-8 text-blue-500" />;
      case 'audio':
        return <Music className="w-8 h-8 text-green-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const getFileTypeBadge = (fileType: string) => {
    const type = fileType?.split('/')[0];
    const colorMap: Record<string, string> = {
      'image': 'bg-blue-100 text-blue-800',
      'video': 'bg-purple-100 text-purple-800',
      'audio': 'bg-green-100 text-green-800',
      'application': 'bg-gray-100 text-gray-800',
      'text': 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={colorMap[type] || 'bg-gray-100 text-gray-800'}>
        {type || 'Unknown'}
      </Badge>
    );
  };

  useEffect(() => {
    // Check if user is admin by verifying localStorage
    const checkAdminAuth = () => {
      const token = localStorage.getItem('adminToken');
      const isAdmin = localStorage.getItem('isAdmin');

      console.log('🔐 AdminDashboard auth check:', {
        hasToken: !!token,
        isAdmin: isAdmin,
        token: token ? token.substring(0, 8) + '...' : null
      });

      if (!isAdmin || !token) {
        console.log('❌ Auth failed, redirecting to login');
        navigate('/admin-login', { replace: true });
        return;
      }

      console.log('✅ Auth passed, loading data...');

      // Token valid, fetch data
      fetchData();
      fetchFiles();
      loadSavedLogs();
      fetchActiveCheckIns();
      fetchEmployees();
      fetchGuests();
      fetchGuestCheckIns();
      fetchChildCheckIns();
    };

    checkAdminAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate stats when data changes
  useEffect(() => {
    const totalRecords = data.length;
    const activeCheckIns = data.filter(record => record && !record.check_out_time).length;
    const completedSessions = data.filter(record => record && record.check_out_time).length;
    const uniqueUsers = new Set(data.filter(record => record && record.full_name).map(record => record.full_name)).size;

    setStats({
      totalRecords: totalRecords || 0,
      activeCheckIns: activeCheckIns || 0,
      completedSessions: completedSessions || 0,
      uniqueUsers: uniqueUsers || 0
    });
  }, [data]);

  // Update filtered data when data changes
  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  // Calculate monthly data
  useEffect(() => {
    const monthlyMap: Record<string, MonthlyData> = {};

    data.forEach(record => {
      const date = new Date(record.check_in_time);
      const year = date.getFullYear();
      const month = date.toLocaleString('default', { month: 'long' });
      const day = date.getDate().toString();

      const key = `${year}-${month}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month,
          year,
          days: {}
        };
      }

      if (!monthlyMap[key].days[day]) {
        monthlyMap[key].days[day] = [];
      }

      monthlyMap[key].days[day].push(record);
    });

    const monthlyArray = Object.values(monthlyMap).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return new Date(`${a.month} 1`).getMonth() - new Date(`${b.month} 1`).getMonth();
    });

    setMonthlyData(monthlyArray);
  }, [data]);

  // Update selected month data
  useEffect(() => {
    if (selectedMonth) {
      const monthData = monthlyData.find(m =>
        `${m.year}-${String(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(m.month) + 1).padStart(2, '0')}` === selectedMonth
      );
      setSelectedMonthData(monthData || null);
    }
  }, [selectedMonth, monthlyData]);

  // Update selected day records
  useEffect(() => {
    if (selectedMonthData && selectedDay) {
      setSelectedDayRecords(selectedMonthData.days[selectedDay] || []);
    }
  }, [selectedMonthData, selectedDay]);

  // ... rest of the code remains the same ...

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Full administrative access to all check-in records
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleBackToMain} className="flex-1 sm:flex-initial">
                <Home className="w-4 h-4 mr-2 text-primary" />
                Back to Main
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex-1 sm:flex-initial">
                <LogoutIcon className="w-4 h-4 mr-2 text-primary" />
                Logout
              </Button>
            </div>
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
                  <p className="text-2xl font-bold">{stats.totalRecords}</p>
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
                  <p className="text-2xl font-bold">{stats.activeCheckIns}</p>
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
                  <p className="text-2xl font-bold">{stats.completedSessions}</p>
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
                  <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">↗ +5% this week</p>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 transition-all duration-300 h-auto p-1">
              <TabsTrigger value="dashboard" className="transition-all duration-200 text-xs sm:text-sm">Dashboard</TabsTrigger>
              <TabsTrigger value="records" className="transition-all duration-200 text-xs sm:text-sm">Records</TabsTrigger>
              <TabsTrigger value="employees" className="transition-all duration-200 text-xs sm:text-sm">Employees</TabsTrigger>
              <TabsTrigger
                value="guests"
                className="transition-all duration-200 text-xs sm:text-sm"
                onClick={() => navigate('/guest-dashboard')}
              >
                Guests
              </TabsTrigger>
              <TabsTrigger
                value="workshop"
                className="transition-all duration-200 text-xs sm:text-sm"
                onClick={() => navigate('/workshop')}
              >
                Workshop
              </TabsTrigger>
              <TabsTrigger
                value="children"
                className="transition-all duration-200 text-xs sm:text-sm"
                onClick={() => navigate('/children')}
              >
                Children
              </TabsTrigger>
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
                                        <div className="font-medium text-sm">
                                          {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })} Daily Logs
                                        </div>
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
                                            const doc = new jsPDF();
                                            const logData = typeof log.log_data === 'string' ? JSON.parse(log.log_data) : log.json_content;

                                            doc.text(`${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })} Daily Logs`, 20, 20);
                                            doc.text(`Total Records: ${log.total_records}`, 20, 30);

                                            let y = 50;
                                            logData.forEach((record: any, index: number) => {
                                              doc.text(`${index + 1}. ${record.userName || record.full_name}`, 20, y);
                                              doc.text(`Check-in: ${record.checkInTime || new Date(record.check_in_time).toLocaleString()}`, 30, y + 7);
                                              doc.text(`Check-out: ${record.checkOutTime || (record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out')}`, 30, y + 14);
                                              y += 25;
                                              if (y > 270) {
                                                doc.addPage();
                                                y = 20;
                                              }
                                            });

                                            const blob = new Blob([doc.output('blob')], { type: 'application/pdf' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}_DailyLogs.pdf`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                          }}
                                          className="text-xs"
                                          title="Download PDF"
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          PDF
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const blob = new Blob([log.summary_content], { type: 'text/plain' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}_DailyLogs.txt`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                          }}
                                          className="text-xs"
                                          title="Download Summary"
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          Text
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
                                file_name: `${new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}_DailyLogs`,
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

            <TabsContent value="employees" className="space-y-6 transition-all duration-300">
              <Card>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-heading">Employee Management</h3>
                      <p className="text-sm text-muted-foreground">Add, edit, and manage employees</p>
                    </div>
                    <Button
                      onClick={() => setShowAddEmployeeModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Employee
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">{employee.full_name}</TableCell>
                            <TableCell>{employee.email || '-'}</TableCell>
                            <TableCell>{employee.department || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                                {employee.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingEmployee(employee)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteEmployee(employee.id, employee.full_name)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {employees.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No employees found. Add your first employee to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>

              {/* Add Employee Modal */}
              <Dialog open={showAddEmployeeModal} onOpenChange={setShowAddEmployeeModal}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                      Add a new employee to the check-in system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={newEmployee.full_name}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email (optional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={newEmployee.department}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="Enter department (optional)"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddEmployeeModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddEmployee}>
                      Add Employee
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Employee Modal */}
              <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Employee</DialogTitle>
                    <DialogDescription>
                      Update employee information
                    </DialogDescription>
                  </DialogHeader>
                  {editingEmployee && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editFullName">Full Name *</Label>
                        <Input
                          id="editFullName"
                          value={editingEmployee.full_name}
                          onChange={(e) => setEditingEmployee(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editEmail">Email</Label>
                        <Input
                          id="editEmail"
                          type="email"
                          value={editingEmployee.email || ''}
                          onChange={(e) => setEditingEmployee(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email (optional)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editDepartment">Department</Label>
                        <Input
                          id="editDepartment"
                          value={editingEmployee.department || ''}
                          onChange={(e) => setEditingEmployee(prev => ({ ...prev, department: e.target.value }))}
                          placeholder="Enter department (optional)"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="editActive"
                          checked={editingEmployee.is_active}
                          onCheckedChange={(checked) => setEditingEmployee(prev => ({ ...prev, is_active: checked as boolean }))}
                        />
                        <Label htmlFor="editActive">Active</Label>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingEmployee(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateEmployee}>
                      Update Employee
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="guests" className="space-y-6 transition-all duration-300">
              {/* Currently Checked In Guests */}
              <Card>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-heading">Currently Checked In Guests</h3>
                      <p className="text-sm text-muted-foreground">Guests currently in the premises</p>
                    </div>
                    <Button variant="outline" onClick={fetchGuestCheckIns} disabled={loadingGuestCheckIns}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingGuestCheckIns ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>

                  {loadingGuestCheckIns ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : guestCheckIns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No guests currently checked in
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Check-in Time</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {guestCheckIns.map((checkIn: any) => (
                            <TableRow key={checkIn.id}>
                              <TableCell className="font-medium">
                                {checkIn.guests?.full_name || 'Unknown'}
                              </TableCell>
                              <TableCell>{checkIn.guests?.email || '-'}</TableCell>
                              <TableCell>{checkIn.guests?.company || '-'}</TableCell>
                              <TableCell>
                                {checkIn.check_in_time ? new Date(checkIn.check_in_time).toLocaleString() : '-'}
                              </TableCell>
                              <TableCell>{checkIn.purpose || '-'}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleGuestCheckOut(checkIn.id, checkIn.guests?.full_name)}
                                >
                                  <LogOut className="h-4 w-4 mr-1" />
                                  Check Out
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </Card>

              {/* Guest Management */}
              <Card>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-heading">Guest Management</h3>
                      <p className="text-sm text-muted-foreground">Add, edit, and manage guests</p>
                    </div>
                    <Button onClick={() => setShowAddGuestModal(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Guest
                    </Button>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guests.map((guest) => (
                          <TableRow key={guest.id}>
                            <TableCell className="font-medium">{guest.full_name}</TableCell>
                            <TableCell>{guest.email || '-'}</TableCell>
                            <TableCell>{guest.phone || '-'}</TableCell>
                            <TableCell>{guest.company || '-'}</TableCell>
                            <TableCell>{guest.purpose || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={guest.is_active ? "default" : "secondary"}>
                                {guest.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingGuest(guest)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteGuest(guest.id, guest.full_name)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {guests.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              No guests found. Add your first guest to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>

              {/* Add Guest Modal */}
              <Dialog open={showAddGuestModal} onOpenChange={setShowAddGuestModal}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Guest</DialogTitle>
                    <DialogDescription>
                      Add a new guest to the check-in system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="guestFullName">Full Name *</Label>
                      <Input
                        id="guestFullName"
                        value={newGuest.full_name}
                        onChange={(e) => setNewGuest({ ...newGuest, full_name: e.target.value })}
                        placeholder="Enter guest full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestEmail">Email</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        value={newGuest.email}
                        onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                        placeholder="Enter email (optional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestPhone">Phone</Label>
                      <Input
                        id="guestPhone"
                        value={newGuest.phone}
                        onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                        placeholder="Enter phone number (optional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestCompany">Company</Label>
                      <Input
                        id="guestCompany"
                        value={newGuest.company}
                        onChange={(e) => setNewGuest({ ...newGuest, company: e.target.value })}
                        placeholder="Enter company (optional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestPurpose">Purpose</Label>
                      <Input
                        id="guestPurpose"
                        value={newGuest.purpose}
                        onChange={(e) => setNewGuest({ ...newGuest, purpose: e.target.value })}
                        placeholder="Enter purpose of visit"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowAddGuestModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddGuest}>
                      Add Guest
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Guest Modal */}
              <Dialog open={!!editingGuest} onOpenChange={() => setEditingGuest(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Guest</DialogTitle>
                    <DialogDescription>
                      Update guest information
                    </DialogDescription>
                  </DialogHeader>
                  {editingGuest && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editGuestName">Full Name *</Label>
                        <Input
                          id="editGuestName"
                          value={editingGuest.full_name || ''}
                          onChange={(e) => setEditingGuest(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editGuestEmail">Email</Label>
                        <Input
                          id="editGuestEmail"
                          value={editingGuest.email || ''}
                          onChange={(e) => setEditingGuest(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editGuestPhone">Phone</Label>
                        <Input
                          id="editGuestPhone"
                          value={editingGuest.phone || ''}
                          onChange={(e) => setEditingGuest(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editGuestCompany">Company</Label>
                        <Input
                          id="editGuestCompany"
                          value={editingGuest.company || ''}
                          onChange={(e) => setEditingGuest(prev => ({ ...prev, company: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editGuestPurpose">Purpose</Label>
                        <Input
                          id="editGuestPurpose"
                          value={editingGuest.purpose || ''}
                          onChange={(e) => setEditingGuest(prev => ({ ...prev, purpose: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="editGuestActive"
                          checked={editingGuest.is_active}
                          onCheckedChange={(checked) => setEditingGuest(prev => ({ ...prev, is_active: checked as boolean }))}
                        />
                        <Label htmlFor="editGuestActive">Active</Label>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingGuest(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditGuest}>
                      Update Guest
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Upload a file to the admin storage for management.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select File</label>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="w-full p-2 border rounded-md text-sm"
              />
            </div>

            {selectedFile && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <Input
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Enter file description"
                className="text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleFileUpload}
                disabled={!selectedFile}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFileUpload(false);
                  setSelectedFile(null);
                  setFileDescription("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Log Details Modal */}
      <Dialog open={showSavedLogModal} onOpenChange={setShowSavedLogModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedSavedLog ?
                  new Date(selectedSavedLog.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) + ' Daily Logs'
                  : 'Daily Logs'
                }
              </span>
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