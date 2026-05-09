import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Users, Utensils, School, Plus, Edit, Trash2, Calendar, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, SadzaRecipient, SadzaDistribution, SadzaStats, getSadzaRecipients, getSadzaDistributions, getSadzaStats, createSadzaRecipient, updateSadzaRecipient, deleteSadzaRecipient, createSadzaDistribution } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function SadzaStatsPage() {
  const [recipients, setRecipients] = useState<SadzaRecipient[]>([]);
  const [distributions, setDistributions] = useState<SadzaDistribution[]>([]);
  const [stats, setStats] = useState<SadzaStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [showAddDistributionModal, setShowAddDistributionModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<SadzaRecipient | null>(null);
  const { toast } = useToast();

  // Form states
  const [recipientForm, setRecipientForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    is_dzikwa_child: false,
    school_name: ""
  });

  const [distributionForm, setDistributionForm] = useState({
    recipient_id: "",
    sadza_portions: 1,
    distribution_purpose: "Community Feeding",
    notes: ""
  });

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recipientsData, distributionsData, statsData] = await Promise.all([
        getSadzaRecipients(),
        getSadzaDistributions(),
        getSadzaStats()
      ]);

      setRecipients(recipientsData.data || []);
      setDistributions(distributionsData.data || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading sadza data:', error);
      toast({
        title: "Error",
        description: "Failed to load sadza statistics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle recipient form submission
  const handleRecipientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingRecipient) {
        await updateSadzaRecipient(editingRecipient.id, recipientForm);
        toast({
          title: "Success",
          description: "Recipient updated successfully",
        });
      } else {
        await createSadzaRecipient(recipientForm);
        toast({
          title: "Success",
          description: "Recipient added successfully",
        });
      }

      setRecipientForm({
        full_name: "",
        phone: "",
        email: "",
        is_dzikwa_child: false,
        school_name: ""
      });
      setEditingRecipient(null);
      setShowAddRecipientModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving recipient:', error);
      toast({
        title: "Error",
        description: "Failed to save recipient",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle distribution form submission
  const handleDistributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createSadzaDistribution(distributionForm);
      toast({
        title: "Success",
        description: "Sadza distribution recorded successfully",
      });

      setDistributionForm({
        recipient_id: "",
        sadza_portions: 1,
        distribution_purpose: "Community Feeding",
        notes: ""
      });
      setShowAddDistributionModal(false);
      loadData();
    } catch (error) {
      console.error('Error recording distribution:', error);
      toast({
        title: "Error",
        description: "Failed to record distribution",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle recipient edit
  const handleEditRecipient = (recipient: SadzaRecipient) => {
    setEditingRecipient(recipient);
    setRecipientForm({
      full_name: recipient.full_name,
      phone: recipient.phone || "",
      email: recipient.email || "",
      is_dzikwa_child: recipient.is_dzikwa_child || false,
      school_name: recipient.school_name || ""
    });
    setShowAddRecipientModal(true);
  };

  // Handle recipient delete
  const handleDeleteRecipient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipient?")) return;

    setIsLoading(true);
    try {
      await deleteSadzaRecipient(id);
      toast({
        title: "Success",
        description: "Recipient deleted successfully",
      });
      loadData();
    } catch (error) {
      console.error('Error deleting recipient:', error);
      toast({
        title: "Error",
        description: "Failed to delete recipient",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Name", "Phone", "Email", "Dzikwa Child", "School", "Date", "Portions", "Purpose"];
    const csvData = distributions.map(dist => [
      dist.sadza_recipients?.full_name || "Unknown",
      dist.sadza_recipients?.phone || "",
      dist.sadza_recipients?.email || "",
      dist.sadza_recipients?.is_dzikwa_child ? "Yes" : "No",
      dist.sadza_recipients?.school_name || "",
      dist.distribution_date,
      dist.sadza_portions || 1,
      dist.distribution_purpose || "Community Feeding"
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sadza-distributions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Sadza Statistics Management
            </h1>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground">
            Track community sadza distribution statistics and manage recipients
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Recipients</p>
                  <p className="text-2xl font-bold">{stats.total_recipients}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <School className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dzikwa Children</p>
                  <p className="text-2xl font-bold">{stats.dzikwa_children}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Community Members</p>
                  <p className="text-2xl font-bold">{stats.community_members}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <Utensils className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Portions</p>
                  <p className="text-2xl font-bold">{stats.total_portions_distributed}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            onClick={() => setShowAddRecipientModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Recipient
          </Button>
          <Button
            onClick={() => setShowAddDistributionModal(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Utensils className="h-4 w-4" />
            Record Distribution
          </Button>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Recent Distributions Table */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Distributions</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Dzikwa Child</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Portions</TableHead>
                  <TableHead>Purpose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributions.slice(0, 10).map((distribution) => (
                  <TableRow key={distribution.id}>
                    <TableCell className="font-medium">
                      {distribution.sadza_recipients?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>{distribution.sadza_recipients?.phone || '-'}</TableCell>
                    <TableCell>
                      {distribution.sadza_recipients?.is_dzikwa_child ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>{distribution.sadza_recipients?.school_name || '-'}</TableCell>
                    <TableCell>{distribution.distribution_date}</TableCell>
                    <TableCell>{distribution.sadza_portions || 1}</TableCell>
                    <TableCell>{distribution.distribution_purpose || 'Community Feeding'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Add/Edit Recipient Modal */}
        <Dialog open={showAddRecipientModal} onOpenChange={setShowAddRecipientModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingRecipient ? 'Edit Recipient' : 'Add New Recipient'}
              </DialogTitle>
              <DialogDescription>
                {editingRecipient
                  ? 'Update the recipient information below.'
                  : 'Add a new sadza recipient to the system.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRecipientSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  value={recipientForm.full_name}
                  onChange={(e) => setRecipientForm({ ...recipientForm, full_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  value={recipientForm.phone}
                  onChange={(e) => setRecipientForm({ ...recipientForm, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={recipientForm.email}
                  onChange={(e) => setRecipientForm({ ...recipientForm, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_dzikwa_child"
                  checked={recipientForm.is_dzikwa_child}
                  onChange={(e) => setRecipientForm({ ...recipientForm, is_dzikwa_child: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_dzikwa_child" className="text-sm font-medium">
                  Dzikwa Child
                </label>
              </div>

              {recipientForm.is_dzikwa_child && (
                <div>
                  <label className="text-sm font-medium">School Name</label>
                  <input
                    type="text"
                    value={recipientForm.school_name}
                    onChange={(e) => setRecipientForm({ ...recipientForm, school_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddRecipientModal(false);
                    setEditingRecipient(null);
                    setRecipientForm({
                      full_name: "",
                      phone: "",
                      email: "",
                      is_dzikwa_child: false,
                      school_name: ""
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingRecipient ? 'Update' : 'Add')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Distribution Modal */}
        <Dialog open={showAddDistributionModal} onOpenChange={setShowAddDistributionModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record Sadza Distribution</DialogTitle>
              <DialogDescription>
                Record a new sadza distribution for a recipient.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDistributionSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient *</label>
                <select
                  required
                  value={distributionForm.recipient_id}
                  onChange={(e) => setDistributionForm({ ...distributionForm, recipient_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a recipient</option>
                  {recipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Number of Portions</label>
                <input
                  type="number"
                  min="1"
                  value={distributionForm.sadza_portions}
                  onChange={(e) => setDistributionForm({ ...distributionForm, sadza_portions: parseInt(e.target.value) || 1 })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Purpose</label>
                <input
                  type="text"
                  value={distributionForm.distribution_purpose}
                  onChange={(e) => setDistributionForm({ ...distributionForm, distribution_purpose: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={distributionForm.notes}
                  onChange={(e) => setDistributionForm({ ...distributionForm, notes: e.target.value })}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDistributionModal(false);
                    setDistributionForm({
                      recipient_id: "",
                      sadza_portions: 1,
                      distribution_purpose: "Community Feeding",
                      notes: ""
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Recording...' : 'Record Distribution'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
