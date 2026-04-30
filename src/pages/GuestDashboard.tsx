import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase, Guest, GuestCheckIn } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Users, RefreshCw, Plus, Edit, Trash2, LogOut, ArrowLeft, Download, Search, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';

export default function GuestDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // State
    const [guests, setGuests] = useState<Guest[]>([]);
    const [guestCheckIns, setGuestCheckIns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCheckIns, setLoadingCheckIns] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

    // Form states
    const [newGuest, setNewGuest] = useState({
        full_name: "",
        email: "",
        phone: "",
        company: "",
        purpose: ""
    });

    // Fetch guests on mount
    useEffect(() => {
        fetchGuests();
        fetchGuestCheckIns();
    }, []);

    const fetchGuests = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('guests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGuests(data || []);
        } catch (error: any) {
            console.error('Error fetching guests:', error);
            toast({
                title: "Error",
                description: "Failed to fetch guests",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchGuestCheckIns = async () => {
        try {
            setLoadingCheckIns(true);
            const { data, error } = await supabase
                .from('guest_check_ins')
                .select('*, guests(*)')
                .order('check_in_time', { ascending: false })
                .limit(100);

            if (error) throw error;
            setGuestCheckIns(data || []);
        } catch (error: any) {
            console.error('Error fetching guest check-ins:', error);
        } finally {
            setLoadingCheckIns(false);
        }
    };

    const handleAddGuest = async () => {
        if (!newGuest.full_name.trim()) {
            toast({
                title: "Error",
                description: "Guest name is required",
                variant: "destructive"
            });
            return;
        }

        try {
            // First, create the guest record
            const { data: guestData, error: guestError } = await supabase
                .from('guests')
                .insert([{
                    full_name: newGuest.full_name,
                    email: newGuest.email || null,
                    phone: newGuest.phone || null,
                    company: newGuest.company || null,
                    purpose: newGuest.purpose || null,
                    is_active: true
                }])
                .select()
                .single();

            if (guestError) throw guestError;

            // Automatically check in the guest
            if (guestData) {
                const { error: checkInError } = await supabase
                    .from('guest_check_ins')
                    .insert([{
                        guest_id: guestData.id,
                        check_in_time: new Date().toISOString(),
                        purpose: newGuest.purpose || 'Visit',
                        notes: null
                    }]);

                if (checkInError) {
                    console.error('Auto check-in error:', checkInError);
                    // Don't throw - guest was created successfully
                }
            }

            toast({
                title: "Success",
                description: "Guest added and checked in successfully"
            });

            setShowAddModal(false);
            setNewGuest({ full_name: "", email: "", phone: "", company: "", purpose: "" });
            fetchGuests();
            fetchGuestCheckIns();
        } catch (error: any) {
            console.error('Error adding guest:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to add guest",
                variant: "destructive"
            });
        }
    };

    const handleEditGuest = async () => {
        if (!editingGuest || !editingGuest.full_name.trim()) {
            toast({
                title: "Error",
                description: "Guest name is required",
                variant: "destructive"
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('guests')
                .update({
                    full_name: editingGuest.full_name,
                    email: editingGuest.email || null,
                    phone: editingGuest.phone || null,
                    company: editingGuest.company || null,
                    purpose: editingGuest.purpose || null,
                    is_active: editingGuest.is_active
                })
                .eq('id', editingGuest.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Guest updated successfully"
            });

            setShowEditModal(false);
            setEditingGuest(null);
            fetchGuests();
        } catch (error: any) {
            console.error('Error updating guest:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to update guest",
                variant: "destructive"
            });
        }
    };

    const handleDeleteGuest = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            const { error } = await supabase
                .from('guests')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Guest deleted successfully"
            });

            fetchGuests();
        } catch (error: any) {
            console.error('Error deleting guest:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to delete guest",
                variant: "destructive"
            });
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
                description: `${guestName} has been checked out`
            });

            fetchGuestCheckIns();
        } catch (error: any) {
            console.error('Error checking out guest:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to check out guest",
                variant: "destructive"
            });
        }
    };

    // Export functions
    const exportToExcel = () => {
        const exportData = filteredGuests.map(guest => ({
            'Full Name': guest.full_name,
            'Email': guest.email || '',
            'Phone': guest.phone || '',
            'Company': guest.company || '',
            'Purpose': guest.purpose || '',
            'Status': guest.is_active ? 'Active' : 'Inactive',
            'Created At': new Date(guest.created_at).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Guests");
        XLSX.writeFile(wb, `guests_export_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
            title: "Success",
            description: "Guest data exported to Excel"
        });
    };

    const exportToCSV = () => {
        const exportData = filteredGuests.map(guest => ({
            full_name: guest.full_name,
            email: guest.email || '',
            phone: guest.phone || '',
            company: guest.company || '',
            purpose: guest.purpose || '',
            is_active: guest.is_active ? 'Active' : 'Inactive',
            created_at: guest.created_at
        }));

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `guests_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast({
            title: "Success",
            description: "Guest data exported to CSV"
        });
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('Guest Management Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

        // Table headers
        let yPos = 40;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Name', 14, yPos);
        doc.text('Email', 60, yPos);
        doc.text('Phone', 100, yPos);
        doc.text('Company', 140, yPos);
        doc.text('Status', 180, yPos);

        // Table data
        doc.setFont('helvetica', 'normal');
        yPos += 8;

        filteredGuests.slice(0, 30).forEach((guest) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(String(guest.full_name || '').substring(0, 20), 14, yPos);
            doc.text(String(guest.email || '-').substring(0, 20), 60, yPos);
            doc.text(String(guest.phone || '-').substring(0, 15), 100, yPos);
            doc.text(String(guest.company || '-').substring(0, 20), 140, yPos);
            doc.text(guest.is_active ? 'Active' : 'Inactive', 180, yPos);
            yPos += 7;
        });

        doc.save(`guests_export_${new Date().toISOString().split('T')[0]}.pdf`);

        toast({
            title: "Success",
            description: "Guest data exported to PDF"
        });
    };

    // Filter guests based on search
    const filteredGuests = guests.filter(guest =>
        guest.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Statistics
    const totalGuests = guests.length;
    const activeGuests = guests.filter(g => g.is_active).length;
    const currentlyCheckedIn = guestCheckIns.filter(c => !c.check_out_time).length;

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
                                onClick={() => navigate('/admin-dashboard')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    <Users className="h-6 w-6" />
                                    Guest Dashboard
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage guests and track visitor check-ins
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/admin-dashboard')}
                        >
                            Back to Admin
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Guests</p>
                            <p className="text-3xl font-bold">{totalGuests}</p>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Active Guests</p>
                            <p className="text-3xl font-bold text-green-600">{activeGuests}</p>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Currently Checked In</p>
                            <p className="text-3xl font-bold text-blue-600">{currentlyCheckedIn}</p>
                        </div>
                    </Card>
                </div>

                {/* Currently Checked In Guests */}
                <Card>
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-heading">Currently Checked In Guests</h3>
                                <p className="text-sm text-muted-foreground">Guests currently in the premises</p>
                            </div>
                            <Button variant="outline" onClick={fetchGuestCheckIns} disabled={loadingCheckIns}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loadingCheckIns ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>

                        {loadingCheckIns ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : guestCheckIns.filter(c => !c.check_out_time).length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No guests currently checked in
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-x-auto">
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
                                        {guestCheckIns
                                            .filter((checkIn: any) => !checkIn.check_out_time)
                                            .map((checkIn: any) => (
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
                            <div className="flex gap-2">
                                <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Guest
                                </Button>
                            </div>
                        </div>

                        {/* Search and Export */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search guests..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={exportToExcel}>
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Excel
                                </Button>
                                <Button variant="outline" onClick={exportToCSV}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    CSV
                                </Button>
                                <Button variant="outline" onClick={exportToPDF}>
                                    <Download className="h-4 w-4 mr-2" />
                                    PDF
                                </Button>
                            </div>
                        </div>

                        {/* Guests Table */}
                        <div className="rounded-md border overflow-x-auto">
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
                                    {filteredGuests.map((guest) => (
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
                                                        onClick={() => {
                                                            setEditingGuest(guest);
                                                            setShowEditModal(true);
                                                        }}
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
                                    {filteredGuests.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                {searchTerm ? "No guests match your search" : "No guests found. Add your first guest to get started."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Add Guest Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
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
                        <Button variant="outline" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddGuest}>
                            Add Guest
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Guest Modal */}
            <Dialog open={showEditModal} onOpenChange={() => {
                setShowEditModal(false);
                setEditingGuest(null);
            }}>
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
                                    onChange={(e) => setEditingGuest(prev => prev ? ({ ...prev, full_name: e.target.value }) : null)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="editGuestEmail">Email</Label>
                                <Input
                                    id="editGuestEmail"
                                    value={editingGuest.email || ''}
                                    onChange={(e) => setEditingGuest(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="editGuestPhone">Phone</Label>
                                <Input
                                    id="editGuestPhone"
                                    value={editingGuest.phone || ''}
                                    onChange={(e) => setEditingGuest(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="editGuestCompany">Company</Label>
                                <Input
                                    id="editGuestCompany"
                                    value={editingGuest.company || ''}
                                    onChange={(e) => setEditingGuest(prev => prev ? ({ ...prev, company: e.target.value }) : null)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="editGuestPurpose">Purpose</Label>
                                <Input
                                    id="editGuestPurpose"
                                    value={editingGuest.purpose || ''}
                                    onChange={(e) => setEditingGuest(prev => prev ? ({ ...prev, purpose: e.target.value }) : null)}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="editGuestActive"
                                    checked={editingGuest.is_active}
                                    onCheckedChange={(checked) => setEditingGuest(prev => prev ? ({ ...prev, is_active: checked as boolean }) : null)}
                                />
                                <Label htmlFor="editGuestActive">Active</Label>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                            setShowEditModal(false);
                            setEditingGuest(null);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditGuest}>
                            Update Guest
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
