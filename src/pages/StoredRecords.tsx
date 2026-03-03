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
import { Loader2, Download, FileText, Calendar, Archive, Edit, Trash2, Eye, Search, X, Save, Home } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [viewingLog, setViewingLog] = useState<{ log: SavedLog; type: 'json' | 'csv' | 'summary' } | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    month: "",
    summary_content: ""
  });
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
        setSavedLogs(logs || []);
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
    const year = log.month.split('-')[0];
    const key = `${year}-${log.month}`;
    if (!acc[key]) {
      acc[key] = {
        month: new Date(log.month + '-01').toLocaleDateString('en-US', { month: 'long' }),
        year: parseInt(year),
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
      if (a.year !== b.year) return b.year - a.year;
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });

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
        description: "Record updated successfully",
      });

      loadSavedLogs();
      setEditingLog(null);
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
    if (!confirm('Are you sure you want to delete this stored record? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('saved_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record deleted successfully",
      });

      loadSavedLogs();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  const openViewDialog = (log: SavedLog, type: 'json' | 'csv' | 'summary') => {
    setViewingLog({ log, type });
  };

  const openEditDialog = (log: SavedLog) => {
    setEditingLog(log);
    setEditForm({
      date: log.date,
      month: log.month,
      summary_content: log.summary_content
    });
  };

  const handleBackToMain = () => {
    navigate("/");
    toast({
      title: "Navigation",
      description: "Returning to main check-in interface.",
    });
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
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Archive className="w-8 h-8 text-primary" />
                Stored Records
              </h1>
              <p className="text-muted-foreground mt-1">
                Access and manage archived daily check-in logs
              </p>
            </div>
            <Button variant="outline" onClick={handleBackToMain} className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Back to Main
            </Button>
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
                              <h3 className="text-lg font-semibold">
                                {log.date} Daily Logs
                              </h3>
                              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-[7px]">
                                {log.total_records} records
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Saved on {new Date(log.saved_at).toLocaleDateString()} at {new Date(log.saved_at).toLocaleTimeString()}
                            </p>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openViewDialog(log, 'json')}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View JSON
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openViewDialog(log, 'csv')}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View CSV
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openViewDialog(log, 'summary')}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Summary
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadContent(log.json_content, `${log.date}_DailyLogs.json`, 'application/json')}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              JSON
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadContent(log.csv_content, `${log.date}_DailyLogs.csv`, 'text/csv')}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              CSV
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadContent(log.summary_content, `${log.date}_DailyLogs_Summary.txt`, 'text/plain')}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Summary
                            </Button>
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
              {viewingLog && `${viewingLog.log.date} - ${viewingLog.type.toUpperCase()} View`}
            </DialogTitle>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{viewingLog.log.total_records} records</span>
                <span>Saved on {new Date(viewingLog.log.saved_at).toLocaleDateString()}</span>
              </div>
              <div className="border rounded-lg p-4 overflow-auto max-h-[60vh] bg-muted/30">
                {viewingLog.type === 'json' && (
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(viewingLog.log.json_content), null, 2)}
                  </pre>
                )}
                {viewingLog.type === 'csv' && (
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {viewingLog.log.csv_content}
                  </pre>
                )}
                {viewingLog.type === 'summary' && (
                  <pre className="text-sm whitespace-pre-wrap">
                    {viewingLog.log.summary_content}
                  </pre>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    const content = viewingLog.type === 'json' ? viewingLog.log.json_content :
                      viewingLog.type === 'csv' ? viewingLog.log.csv_content :
                        viewingLog.log.summary_content;
                    const filename = `${viewingLog.log.date}_DailyLogs_${viewingLog.type}.${viewingLog.type === 'summary' ? 'txt' : viewingLog.type}`;
                    const mimeType = viewingLog.type === 'json' ? 'application/json' :
                      viewingLog.type === 'csv' ? 'text/csv' : 'text/plain';
                    downloadContent(content, filename, mimeType);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {viewingLog.type.toUpperCase()}
                </Button>
                <Button variant="outline" onClick={() => setViewingLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
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
    </div>
  );
}