import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, Trash2, Users, ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Child {
  id: string;
  full_name: string;
  parent_name: string;
  grade: string;
  is_active: boolean;
  created_at: string;
}

interface ChildCheckIn {
  id: string;
  child_id: string;
  check_in_time: string;
  check_out_time: string | null;
  dzikwa_children: {
    full_name: string;
    parent_name: string;
    grade: string;
  };
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [childCheckIns, setChildCheckIns] = useState<ChildCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [newChild, setNewChild] = useState({
    full_name: "",
    parent_name: "",
    grade: ""
  });

  // Fetch children data
  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('dzikwa_children')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Failed to fetch children",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch active check-ins
  const fetchChildCheckIns = async () => {
    setLoadingCheckIns(true);
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
      setLoadingCheckIns(false);
    }
  };

  // Add new child
  const handleAddChild = async () => {
    if (!newChild.full_name.trim() || !newChild.parent_name.trim()) {
      toast({
        title: "Error",
        description: "Child name and parent name are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('dzikwa_children')
        .insert({
          full_name: newChild.full_name.trim(),
          parent_name: newChild.parent_name.trim(),
          grade: newChild.grade.trim() || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${data.full_name} has been added successfully`,
      });

      setNewChild({ full_name: "", parent_name: "", grade: "" });
      setShowAddModal(false);
      fetchChildren();
    } catch (error) {
      console.error('Error adding child:', error);
      toast({
        title: "Error",
        description: "Failed to add child",
        variant: "destructive",
      });
    }
  };

  // Update child
  const handleUpdateChild = async () => {
    if (!editingChild) return;

    try {
      const { error } = await supabase
        .from('dzikwa_children')
        .update({
          full_name: editingChild.full_name.trim(),
          parent_name: editingChild.parent_name.trim(),
          grade: editingChild.grade?.trim() || null,
          is_active: editingChild.is_active
        })
        .eq('id', editingChild.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Child updated successfully",
      });

      setEditingChild(null);
      fetchChildren();
    } catch (error) {
      console.error('Error updating child:', error);
      toast({
        title: "Error",
        description: "Failed to update child",
        variant: "destructive",
      });
    }
  };

  // Delete child
  const handleDeleteChild = async (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to delete ${childName}? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('dzikwa_children')
        .delete()
        .eq('id', childId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${childName} has been deleted`,
      });

      fetchChildren();
    } catch (error) {
      console.error('Error deleting child:', error);
      toast({
        title: "Error",
        description: "Failed to delete child",
        variant: "destructive",
      });
    }
  };

  // Check out child
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

  useEffect(() => {
    fetchChildren();
    fetchChildCheckIns();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading children management...</span>
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
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/admin-dashboard')} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Children Management
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Manage children check-ins and check-outs
                </p>
              </div>
            </div>
          </div>

          {/* Active Check-ins */}
          <Card>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-heading flex items-center gap-2">
                    <Users className="w-5 h-5 text-success" />
                    Active Check-ins ({childCheckIns.length})
                  </h3>
                  <p className="text-sm text-muted-foreground">Children currently checked in</p>
                </div>
                <Button
                  onClick={fetchChildCheckIns}
                  variant="outline"
                  size="sm"
                  disabled={loadingCheckIns}
                >
                  {loadingCheckIns ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Refresh
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {childCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="flex items-center justify-between p-4 border rounded-[7px] hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium">{checkIn.dzikwa_children.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Parent: {checkIn.dzikwa_children.parent_name} • Grade: {checkIn.dzikwa_children.grade || 'Not specified'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Checked in: {new Date(checkIn.check_in_time).toLocaleTimeString()}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleChildCheckOut(checkIn.id, checkIn.dzikwa_children.full_name)}
                      className="hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Check Out
                    </Button>
                  </div>
                ))}
                {childCheckIns.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No children currently checked in.
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Children Management */}
          <Card>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-heading">Children Registry</h3>
                  <p className="text-sm text-muted-foreground">Add, edit, and manage children</p>
                </div>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Child
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {children.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell className="font-medium">{child.full_name}</TableCell>
                        <TableCell>{child.parent_name}</TableCell>
                        <TableCell>{child.grade || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={child.is_active ? 'default' : 'secondary'}>
                            {child.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingChild(child)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteChild(child.id, child.full_name)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {children.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No children found. Add your first child to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>

          {/* Add Child Modal */}
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Child</DialogTitle>
                <DialogDescription>
                  Add a new child to the check-in system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Child Name *</Label>
                  <Input
                    id="fullName"
                    value={newChild.full_name}
                    onChange={(e) => setNewChild(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter child's full name"
                  />
                </div>
                <div>
                  <Label htmlFor="parentName">Parent Name *</Label>
                  <Input
                    id="parentName"
                    value={newChild.parent_name}
                    onChange={(e) => setNewChild(prev => ({ ...prev, parent_name: e.target.value }))}
                    placeholder="Enter parent's full name"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    value={newChild.grade}
                    onChange={(e) => setNewChild(prev => ({ ...prev, grade: e.target.value }))}
                    placeholder="Enter grade (optional)"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleAddChild} className="flex-1">
                    Add Child
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Child Modal */}
          <Dialog open={!!editingChild} onOpenChange={(open) => !open && setEditingChild(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Child</DialogTitle>
                <DialogDescription>
                  Update child information
                </DialogDescription>
              </DialogHeader>
              {editingChild && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editFullName">Child Name *</Label>
                    <Input
                      id="editFullName"
                      value={editingChild.full_name}
                      onChange={(e) => setEditingChild(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                      placeholder="Enter child's full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editParentName">Parent Name *</Label>
                    <Input
                      id="editParentName"
                      value={editingChild.parent_name}
                      onChange={(e) => setEditingChild(prev => prev ? { ...prev, parent_name: e.target.value } : null)}
                      placeholder="Enter parent's full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editGrade">Grade</Label>
                    <Input
                      id="editGrade"
                      value={editingChild.grade || ''}
                      onChange={(e) => setEditingChild(prev => prev ? { ...prev, grade: e.target.value } : null)}
                      placeholder="Enter grade (optional)"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editActive"
                      checked={editingChild.is_active}
                      onChange={(e) => setEditingChild(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
                      className="rounded"
                    />
                    <Label htmlFor="editActive">Active</Label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleUpdateChild} className="flex-1">
                      Update Child
                    </Button>
                    <Button variant="outline" onClick={() => setEditingChild(null)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
