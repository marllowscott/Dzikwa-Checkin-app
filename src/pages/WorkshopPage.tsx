import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, ArrowLeft, Save, Archive, UserCheck, Plus, LogOut, Search, RefreshCw, Edit, Trash2, Download, Calendar } from "lucide-react";
import { createWorkshopGuest, checkInWorkshopGuest, getWorkshopCheckIns, checkOutWorkshopGuest } from "@/lib/workshop";
import { supabase } from "@/lib/supabase";
import { useAutomaticArchive } from "@/lib/automaticArchive";

export default function WorkshopPage() {
  const [activeTab, setActiveTab] = useState("checkin");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [workshopCheckIns, setWorkshopCheckIns] = useState([]);
  const [workshopGuests, setWorkshopGuests] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [displayGuests, setDisplayGuests] = useState<any[]>([]);
  const [newGuest, setNewGuest] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    workshop_type: "Standard Workshop",
    special_notes: ""
  });
  const [stats, setStats] = useState({
    totalGuests: 0,
    activeGuests: 0,
    currentlyCheckedIn: 0
  });
  const { toast } = useToast();
  const { archiveRecordOnCheckout } = useAutomaticArchive();
  const navigate = useNavigate();

  // Load workshop data
  useEffect(() => {
    loadWorkshopData();
    loadWorkshopGuests();
  }, []);

  // Listen for check-out events to refresh active check-ins
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Refreshing workshop check-ins after checkout');
      loadWorkshopData();
    };

    window.addEventListener('refreshActiveCheckIns', handleRefresh);

    return () => {
      window.removeEventListener('refreshActiveCheckIns', handleRefresh);
    };
  }, []);

  const loadWorkshopData = async () => {
    try {
      const { data: checkIns, error } = await getActiveWorkshopCheckIns(); // Only get active check-ins
      if (error) {
        console.error('Error fetching workshop check-ins:', error);
        return;
      }

      const validCheckIns = checkIns || [];
      setWorkshopCheckIns(validCheckIns);

      // Calculate stats - all are now active check-ins
      const totalGuests = validCheckIns.length;
      const activeGuests = validCheckIns.length;
      const currentlyCheckedIn = validCheckIns.length;

      setStats({
        totalGuests,
        activeGuests,
        currentlyCheckedIn
      });
    } catch (error) {
      console.error('Error loading workshop data:', error);
    }
  };

  const loadWorkshopGuests = async () => {
    try {
      const { data: guests, error } = await supabase
        .from('workshop_guests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading workshop guests:', error);
        return;
      }

      setWorkshopGuests(guests || []);
    } catch (error) {
      console.error('Error loading workshop guests:', error);
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
        .from('workshop_guests')
        .insert([{
          full_name: newGuest.full_name,
          email: newGuest.email || null,
          phone: newGuest.phone || null,
          company: newGuest.company || null,
          workshop_type: newGuest.workshop_type,
          special_notes: newGuest.special_notes || null,
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to add guest",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${data.full_name} has been added as a workshop guest`,
      });

      // Reset form and refresh
      setNewGuest({
        full_name: "",
        email: "",
        phone: "",
        company: "",
        workshop_type: "Standard Workshop",
        special_notes: ""
      });
      setShowAddModal(false);
      loadWorkshopGuests();
    } catch (error: any) {
      console.error('Error adding guest:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add guest",
        variant: "destructive",
      });
    }
  };

  const handleWorkshopCheckOut = async (checkInId: string, guestName: string) => {
    try {
      const { data, error } = await checkOutWorkshopGuest(checkInId);

      if (error) {
        console.error('Workshop checkout error:', error);
        toast({
          title: "Error",
          description: `Failed to check out ${guestName}: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Automatic archival
      await archiveRecordOnCheckout('workshop', checkInId);

      toast({
        title: "Success",
        description: `${guestName} has been checked out successfully`,
      });

      // Refresh both guests and check-ins data
      await Promise.all([
        loadWorkshopGuests(),
        loadWorkshopData()
      ]);
    } catch (error) {
      console.error('Error checking out participant:', error);
      toast({
        title: "Error",
        description: "Failed to check out participant. Please try again.",
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

  const saveTodaysWorkshopLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaysWorkshopCheckIns = workshopCheckIns.filter(checkIn => {
        const recordDate = new Date(checkIn.check_in_time);
        return !isNaN(recordDate.getTime()) && recordDate.toISOString().split('T')[0] === today;
      });

      if (todaysWorkshopCheckIns.length === 0) {
        toast({
          title: "No Records",
          description: "No valid workshop records found for today",
          variant: "destructive",
        });
        return;
      }

      const cleanedRecords = todaysWorkshopCheckIns.map(record => {
        const checkInTime = record.check_in_time && !isNaN(new Date(record.check_in_time).getTime())
          ? record.check_in_time : new Date().toISOString();
        const checkOutTime = record.check_out_time && !isNaN(new Date(record.check_out_time).getTime())
          ? record.check_out_time : null;

        return {
          id: record.id,
          full_name: record.full_name || 'Unknown',
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          email: record.email,
          phone: record.phone,
          company: record.company,
          workshop_type: record.workshop_type,
          special_notes: record.special_notes
        };
      });

      // Instead of creating a separate table, we'll just mark records as saved
      // by adding a 'saved_date' field to workshop_check_ins
      const { error } = await supabase
        .from('workshop_check_ins')
        .update({
          saved_date: new Date().toISOString(),
          saved: true
        })
        .in('id', todaysWorkshopCheckIns.map(r => r.id));

      if (error) {
        toast({
          title: "Database Error",
          description: `Failed to save: ${error.message || JSON.stringify(error)}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Today's ${cleanedRecords.length} workshop records saved successfully`,
      });

      // Remove saved records from active check-ins
      const { error: resetError } = await supabase
        .from('workshop_check_ins')
        .delete()
        .in('id', todaysWorkshopCheckIns.map(r => r.id));

      if (resetError) {
        toast({
          title: "Warning",
          description: `Logs saved but failed to reset workshop list: ${resetError.message || 'Unknown error'}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Today's ${cleanedRecords.length} records saved and ${todaysWorkshopCheckIns.length} records removed from active list`,
        });
      }

      loadWorkshopData();
    } catch (error) {
      console.error('Error saving workshop logs:', error);
      toast({
        title: "Error",
        description: "Failed to save today's workshop logs. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Esteemed Guest Form State
  const [esteemedForm, setEsteemedForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    workshop_type: "Esteemed Workshop",
    special_notes: ""
  });

  // Common Guest Form State
  const [commonForm, setCommonForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    workshop_type: "Standard Workshop"
  });

  const handleInputChange = (formType: string, field: string, value: string) => {
    if (formType === "esteemed") {
      setEsteemedForm(prev => ({ ...prev, [field]: value }));
    } else {
      setCommonForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (formType: string) => {
    const formData = formType === "esteemed" ? esteemedForm : commonForm;

    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create workshop guest profile
      const guest = await createWorkshopGuest({
        full_name: formData.full_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        workshop_type: formData.workshop_type,
        special_notes: formType === "esteemed" ? (formData as any).special_notes : undefined,
      });

      // Check in the workshop guest
      const checkIn = await checkInWorkshopGuest(guest.id, formData.workshop_type, formData.workshop_type);

      toast({
        title: formType === "esteemed" ? "Welcome, Esteemed Guest!" : "Welcome!",
        description: `${guest.full_name} has been checked in successfully.`,
        variant: formType === "esteemed" ? "default" : "default",
      });

      // Reset form
      if (formType === "esteemed") {
        setEsteemedForm({
          full_name: "",
          email: "",
          phone: "",
          company: "",
          workshop_type: "Esteemed Workshop",
          special_notes: ""
        });
      } else {
        setCommonForm({
          full_name: "",
          email: "",
          phone: "",
          company: "",
          workshop_type: "Standard Workshop"
        });
      }

    } catch (error) {
      console.error("Error checking in guest:", error);
      toast({
        title: "Check-In Failed",
        description: "Failed to check in guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }

    // Reload data after successful check-in
    loadWorkshopData();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 mt-[5px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/admin-dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Workshop Check-In
              </h1>
              <p className="text-sm text-muted-foreground">
                Register and manage workshop participants
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/workshop-stored-records')}
            >
              <Save className="w-4 h-4 mr-2 text-primary" />
              Record Storage
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Guests</p>
              <p className="text-3xl font-bold">{stats.totalGuests}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Active Guests</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeGuests}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Currently Checked In</p>
              <p className="text-3xl font-bold text-blue-600">{stats.currentlyCheckedIn}</p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="p-6 bg-gradient-card shadow-card rounded-[7px]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="checkin">
                <UserCheck className="w-4 h-4 mr-2" />
                Check-In
              </TabsTrigger>
              <TabsTrigger value="esteemed">
                Esteemed Guests
              </TabsTrigger>
              <TabsTrigger value="common">
                Common Guests
              </TabsTrigger>
              <TabsTrigger value="management">
                <Users className="w-4 h-4 mr-2" />
                Management
              </TabsTrigger>
            </TabsList>

            {/* Current Check-Ins Tab */}
            <TabsContent value="checkin" className="mt-6">
              <div className="space-y-6">
                {/* Active Check-Ins */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Active Workshop Check-Ins</h3>
                  {workshopCheckIns.filter(guest => !guest.saved && !guest.check_out_time).length === 0 ? (
                    <Card className="p-8 text-center">
                      <UserCheck className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Active Check-Ins</h3>
                      <p className="text-muted-foreground">
                        Workshop participants will appear here after check-in.
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {workshopCheckIns.filter(guest => !guest.saved && !guest.check_out_time).map((guest) => (
                        <Card key={guest.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{guest.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Check-in: {new Date(guest.check_in_time).toLocaleString()}
                              </p>
                              {guest.workshop_type && (
                                <Badge className="mt-1 bg-primary text-primary-foreground">
                                  {guest.workshop_type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge className={guest.check_out_time ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                                {guest.check_out_time ? "Checked Out" : "Active"}
                              </Badge>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleWorkshopCheckOut(guest.id, guest.full_name)}
                              >
                                <LogOut className="h-4 w-4 mr-1" />
                                Check Out
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saved Records */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Saved Records</h3>
                  {workshopCheckIns.filter(guest => guest.saved).length === 0 ? (
                    <Card className="p-8 text-center">
                      <Archive className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Saved Records</h3>
                      <p className="text-muted-foreground">
                        Saved workshop records will appear here after using "Save Today's Logs".
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {workshopCheckIns.filter(guest => guest.saved).map((guest) => (
                        <Card key={guest.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{guest.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Check-in: {new Date(guest.check_in_time).toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Saved: {guest.saved_date ? new Date(guest.saved_date).toLocaleString() : 'N/A'}
                              </p>
                              {guest.workshop_type && (
                                <Badge className="mt-1 bg-primary text-primary-foreground">
                                  {guest.workshop_type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge className="bg-green-100 text-green-800">
                                Saved
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowExportDialog(true)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Esteemed Guest Tab */}
            <TabsContent value="esteemed" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary text-primary-foreground">
                    VIP
                  </Badge>
                  <h3 className="text-xl font-semibold text-foreground">
                    Esteemed Guest Registration
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="esteemed-full_name" className="text-foreground font-medium">
                      Full Name *
                    </Label>
                    <Input
                      id="esteemed-full_name"
                      type="text"
                      placeholder="Enter your full name"
                      value={esteemedForm.full_name}
                      onChange={(e) => handleInputChange("esteemed", "full_name", e.target.value)}
                      className="h-10 sm:h-12 border-input focus:ring-primary bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="esteemed-email" className="text-foreground font-medium">
                      Email Address *
                    </Label>
                    <Input
                      id="esteemed-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={esteemedForm.email}
                      onChange={(e) => handleInputChange("esteemed", "email", e.target.value)}
                      className="h-10 sm:h-12 border-input focus:ring-primary bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="esteemed-phone" className="text-foreground font-medium">
                      Phone Number *
                    </Label>
                    <Input
                      id="esteemed-phone"
                      type="tel"
                      placeholder="+263 123 4567"
                      value={esteemedForm.phone}
                      onChange={(e) => handleInputChange("esteemed", "phone", e.target.value)}
                      className="h-10 sm:h-12 border-input focus:ring-primary bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="esteemed-company" className="text-foreground font-medium">
                      Organization/Company
                    </Label>
                    <Input
                      id="esteemed-company"
                      type="text"
                      placeholder="Company or organization name"
                      value={esteemedForm.company}
                      onChange={(e) => handleInputChange("esteemed", "company", e.target.value)}
                      className="h-10 sm:h-12 border-input focus:ring-primary bg-white"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="esteemed-requirements" className="text-foreground font-medium">
                      Special Requirements / Notes
                    </Label>
                    <Textarea
                      id="esteemed-notes"
                      placeholder="Any special requirements, dietary restrictions, accessibility needs, etc."
                      value={esteemedForm.special_notes}
                      onChange={(e) => handleInputChange("esteemed", "special_notes", e.target.value)}
                      className="min-h-[80px] border-input focus:ring-primary bg-white resize-none"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSubmit("esteemed")}
                  className="w-full mt-6 h-12 sm:h-14 text-sm sm:text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevation transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Check In Esteemed Guest"}
                </Button>
              </div>
            </TabsContent>

            {/* Common Guest Tab */}
            <TabsContent value="common" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-secondary text-secondary-foreground">
                    Standard
                  </Badge>
                  <h3 className="text-xl font-semibold text-foreground">
                    Common Guest Registration
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="common-full_name" className="text-foreground font-medium">
                      Full Name *
                    </Label>
                    <Input
                      id="common-full_name"
                      type="text"
                      placeholder="Enter your full name"
                      value={commonForm.full_name}
                      onChange={(e) => handleInputChange("common", "full_name", e.target.value)}
                      className="h-10 sm:h-12 border-input focus:ring-primary bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="common-email" className="text-foreground font-medium">
                      Email Address (Optional)
                    </Label>
                    <Input
                      id="common-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={commonForm.email}
                      onChange={(e) => handleInputChange("common", "email", e.target.value)}
                      className="h-10 sm:h-12 border-input focus:ring-primary bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="common-phone" className="text-foreground font-medium">
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="common-phone"
                      type="tel"
                      placeholder="+263 123 4567"
                      value={commonForm.phone}
                      onChange={(e) => handleInputChange("common", "phone", e.target.value)}
                      className="h-10 sm:h-12 border-input focus:ring-primary bg-white"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSubmit("common")}
                  className="w-full mt-6 h-12 sm:h-14 text-sm sm:text-lg font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-elevation transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Quick Check In"}
                </Button>
              </div>
            </TabsContent>

            {/* Workshop Management Tab */}
            <TabsContent value="management" className="mt-6">
              <Card>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-heading">Workshop Registry</h3>
                      <p className="text-sm text-muted-foreground">Add, edit, and manage workshop participants</p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Participant
                    </Button>
                  </div>

                  {/* Search and Export */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search workshop participants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExportDialog(true)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export with Date Range
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/workshop-stored-records')}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Record Storage
                      </Button>
                    </div>

                    {/* Guests Table */}
                    <div className="overflow-x-auto">
                      <div className="space-y-2">
                        {(() => {
                          const filteredGuests = workshopGuests.filter(guest =>
                            searchTerm === "" ||
                            guest.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (guest.company && guest.company.toLowerCase().includes(searchTerm.toLowerCase()))
                          );

                          // Reset to show only 4 when searching
                          if (searchTerm) {
                            setShowAllParticipants(false);
                          }

                          const guestsToShow = showAllParticipants ? filteredGuests : filteredGuests.slice(0, 4);

                          return (
                            <>
                              {guestsToShow.map((guest) => (
                                <Card key={guest.id} className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <div>
                                          <p className="font-medium text-foreground">{guest.full_name}</p>
                                          {guest.email && <p className="text-sm text-muted-foreground">{guest.email}</p>}
                                          {guest.phone && <p className="text-sm text-muted-foreground">{guest.phone}</p>}
                                          {guest.company && <p className="text-sm text-muted-foreground">{guest.company}</p>}
                                        </div>
                                        <Badge className="bg-primary text-primary-foreground">
                                          {guest.workshop_type}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => exportToCSV([guest], `workshop-record-${guest.full_name.replace(/\s+/g, '-').toLowerCase()}`)}
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingGuest(guest)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          // Delete guest logic here
                                          if (confirm(`Are you sure you want to delete ${guest.full_name}?`)) {
                                            // Add delete function
                                          }
                                        }}
                                        className="hover:bg-destructive/10"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              ))}

                              {/* Show All Button */}
                              {!showAllParticipants && filteredGuests.length > 4 && (
                                <div className="mt-4 text-center">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowAllParticipants(true)}
                                    className="flex items-center gap-2 mx-auto"
                                  >
                                    <Users className="w-4 h-4" />
                                    Show All {filteredGuests.length} Participants
                                  </Button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={saveTodaysWorkshopLogs}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Today's Workshop Logs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoadingCheckIns(true);
                loadWorkshopData().finally(() => setLoadingCheckIns(false));
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loadingCheckIns ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-xs text-muted-foreground opacity-50">
            Admin access: Double-tap 'A' key
          </p>
        </div>
      </div >

      {/* Add Guest Modal */}
      < Dialog open={showAddModal} onOpenChange={setShowAddModal} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workshop Participant</DialogTitle>
            <DialogDescription>
              Update workshop participant information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="guest-full_name">Full Name *</Label>
                  <Input
                    id="guest-full_name"
                    value={newGuest.full_name}
                    onChange={(e) => setNewGuest({ ...newGuest, full_name: e.target.value })}
                    placeholder="Enter guest's full name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-email">Email Address</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    placeholder="guest.email@example.com"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-phone">Phone Number</Label>
                  <Input
                    id="guest-phone"
                    type="tel"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    placeholder="+263 123 4567"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="guest-company">Company/Organization</Label>
                  <Input
                    id="guest-company"
                    value={newGuest.company}
                    onChange={(e) => setNewGuest({ ...newGuest, company: e.target.value })}
                    placeholder="Company or organization name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-workshop_type">Workshop Type</Label>
                  <select
                    id="guest-workshop_type"
                    value={newGuest.workshop_type}
                    onChange={(e) => setNewGuest({ ...newGuest, workshop_type: e.target.value })}
                    className="w-full p-2 h-10 border border-input rounded-md bg-background"
                  >
                    <option value="Standard Workshop">Standard Workshop</option>
                    <option value="Esteemed Workshop">Esteemed Workshop</option>
                    <option value="VIP Workshop">VIP Workshop</option>
                    <option value="Training Session">Training Session</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest-notes">Special Notes</Label>
                  <Textarea
                    id="guest-notes"
                    value={newGuest.special_notes}
                    onChange={(e) => setNewGuest({ ...newGuest, special_notes: e.target.value })}
                    placeholder="Any special requirements or notes"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGuest} className="flex-1">
              Add Participant
            </Button>
          </div>
        </DialogContent>
      </Dialog >


      {/* Export Dialog */}
      < Dialog open={showExportDialog} onOpenChange={setShowExportDialog} >
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
      </Dialog >
    </div >
  );
}
