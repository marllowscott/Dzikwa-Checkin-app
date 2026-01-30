import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase, CheckInRecord } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Clock, TrendingUp, Loader2, Download, Edit, Trash2, Plus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';

interface MonthlyData {
  month: string;
  year: number;
  days: { [day: string]: CheckInRecord[] };
}

export default function Dashboard() {
  const [data, setData] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [filters, setFilters] = useState({
    fullName: "",
    dateFrom: "",
    dateTo: ""
  });
  const [editingRecord, setEditingRecord] = useState<CheckInRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    full_name: "",
    check_in_time: "",
    check_out_time: ""
  });
  const { toast } = useToast();

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
        if (error.code === 'PGRST116') {
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
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please check your database connection.",
        variant: "destructive",
      });
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(record => {
      const matchesName = !filters.fullName || record.full_name.toLowerCase().includes(filters.fullName.toLowerCase());
      const recordDate = new Date(record.check_in_time).toISOString().split('T')[0];
      const matchesDateFrom = !filters.dateFrom || recordDate >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || recordDate <= filters.dateTo;

      return matchesName && matchesDateFrom && matchesDateTo;
    });
  }, [data, filters]);

  const monthlyData = useMemo(() => {
    const monthGroups: { [key: string]: CheckInRecord[] } = {};
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    filteredData.forEach(record => {
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
  }, [filteredData, selectedMonth]);

  const selectedMonthData = monthlyData.find(m =>
    `${m.year}-${String(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(m.month) + 1).padStart(2, '0')}` === selectedMonth
  );

  const selectedDayRecords = selectedMonthData?.days[selectedDay] || [];

  const analyticsData = useMemo(() => {
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

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(selectedDayRecords.map(record => ({
      'Full Name': record.full_name,
      'Check In Time': new Date(record.check_in_time).toLocaleString(),
      'Check Out Time': record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CheckIns");
    XLSX.writeFile(wb, `checkins-${selectedDay}.xlsx`);
  };

  const exportToCSV = () => {
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
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Check-Ins for ${selectedDay}`, 20, 20);

    let y = 40;
    selectedDayRecords.forEach((record, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${index + 1}. ${record.full_name} - ${new Date(record.check_in_time).toLocaleString()}`, 20, y);
      y += 10;
    });

    doc.save(`checkins-${selectedDay}.pdf`);
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
    if (!confirm('Are you sure you want to delete this record?')) return;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading dashboard...</span>
            </div>
          </div>
        </div>
  
        {/* Edit Modal */}
        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
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
                      check_out_time: e.target.value ? new Date(e.target.value).toISOString() : ""
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Months</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
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
                      "w-full text-left p-2 rounded hover:bg-muted",
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
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Filter by name"
                  value={filters.fullName}
                  onChange={(e) => setFilters(prev => ({ ...prev, fullName: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="From date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="To date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </Card>

            {selectedMonthData && (
              <>
                {/* Days List */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">📅 {selectedMonthData.month} {selectedMonthData.year} - Days</h3>
                  <div className="grid grid-cols-7 gap-2">
                    {Object.entries(selectedMonthData.days).map(([day, records]) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          "p-2 text-center rounded hover:bg-muted",
                          selectedDay === day && "bg-primary text-primary-foreground"
                        )}
                      >
                        <div className="text-sm font-medium">{new Date(day).getDate()}</div>
                        <div className="text-xs">{records.length} records</div>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Records Table */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">📄 Records for {selectedDay}</h3>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Record
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportToExcel}>
                        <Download className="w-4 h-4 mr-1" />
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <Download className="w-4 h-4 mr-1" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportToPDF}>
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDayRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.full_name}</TableCell>
                          <TableCell>{new Date(record.check_in_time).toLocaleString()}</TableCell>
                          <TableCell>
                            {record.check_out_time ? new Date(record.check_out_time).toLocaleString() : 'Not checked out'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingRecord(record)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(record.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>

                {/* Analytics */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Check-Ins by Day</h3>
                  <ChartContainer config={{}} className="h-64">
                    <BarChart data={analyticsData.checkInsByDay}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Bar dataKey="checkIns" fill="#8884d8" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </BarChart>
                  </ChartContainer>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}