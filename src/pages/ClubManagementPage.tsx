import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useClubs } from '@/hooks/useClubs';
import { Club, ClubVisibility } from '@/types/clubs';
import { toast } from 'sonner';

// Define enum for member roles
type MemberRole = 'creator' | 'admin' | 'member';

// Update ClubMembership interface to include the id and user fields
interface ClubMembership {
  id: string;
  club_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import {
  Settings,
  Users,
  UserPlus,
  UserMinus,
  Shield,
  Copy,
  Check,
  Calendar,
  MessageSquare,
  FileText,
  Flag,
  AlertCircle,
  Trash2,
  Save,
  X,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';

const ClubManagementPage = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateClub, deleteClub } = useClubs();
  
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    tags: '',
    course_code: '',
    visibility: 'private' as ClubVisibility,
    join_code: '',
  });
  const [isJoinCodeCopied, setIsJoinCodeCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClubMembership | null>(null);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState('member');
  
  // Fetch club details
  useEffect(() => {
    if (!clubId || !user) return;
    
    const fetchClubData = async () => {
      setLoading(true);
      try {
        // Get club details
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select(`
            id, 
            name, 
            description, 
            tags, 
            course_code, 
            visibility, 
            join_code, 
            created_by, 
            created_at,
            creator:profiles!clubs_created_by_fkey(
              first_name, 
              last_name, 
              avatar_url
            ),
            member_count:club_memberships(count)
          `)
          .eq('id', clubId)
          .single();
          
        if (clubError) throw clubError;
        
        // Process club data
        const clubInfo = {
          ...clubData,
          creator_first_name: clubData.creator?.first_name,
          creator_last_name: clubData.creator?.last_name,
          creator_avatar_url: clubData.creator?.avatar_url,
          member_count: clubData.member_count?.[0]?.count || 0
        };
        
        setClub(clubInfo as unknown as Club);
        setFormValues({
          name: clubInfo.name || '',
          description: clubInfo.description || '',
          tags: Array.isArray(clubInfo.tags) ? clubInfo.tags.join(', ') : clubInfo.tags || '',
          course_code: clubInfo.course_code || '',
          visibility: (clubInfo.visibility || 'private') as ClubVisibility,
          join_code: clubInfo.join_code || '',
        });
        
        // Get user role in the club
        const { data: memberData, error: memberError } = await supabase
          .from('club_memberships')
          .select('role')
          .eq('club_id', clubId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!memberError && memberData) {
          setUserRole(memberData.role as string);
        } else {
          // If user is not a member or not an admin/creator, redirect to club details
          navigate(`/clubs/${clubId}`);
          return;
        }
        
        // Verify user has permission to manage the club
        if (memberData?.role !== 'admin' && memberData?.role !== 'creator') {
          toast.error('You do not have permission to manage this club');
          navigate(`/clubs/${clubId}`);
          return;
        }
        
        // Get club members
        const { data: membersData, error: membersError } = await supabase
          .from('club_memberships')
          .select(`
            club_id, 
            user_id, 
            role, 
            joined_at,
            user:profiles!club_memberships_user_id_fkey(
              id,
              first_name, 
              last_name, 
              avatar_url
            )
          `)
          .eq('club_id', clubId)
          .order('role', { ascending: false });
          
        if (membersError) throw membersError;
        
        // Convert the data to the right type
        const typedMembersData = membersData as unknown as ClubMembership[];
        setMembers(typedMembersData);
        
      } catch (error) {
        console.error('Error fetching club data:', error);
        toast.error('Failed to load club information');
        navigate('/clubs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClubData();
  }, [clubId, user, navigate]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club || !user) return;
    
    setSavingChanges(true);
    try {
      // Process tags from comma-separated string to array
      const tagsArray = formValues.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      const updateData = {
        name: formValues.name,
        description: formValues.description,
        tags: tagsArray,
        course_code: formValues.course_code,
        visibility: formValues.visibility,
      };
      
      const { data, error } = await supabase
        .from('clubs')
        .update(updateData)
        .eq('id', club.id);
        
      if (error) throw error;
      
      toast.success('Club details updated successfully');
      
      // Refresh club data
      const { data: refreshedClub, error: refreshError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', club.id)
        .single();
        
      if (!refreshError && refreshedClub) {
        setClub({
          ...club,
          ...refreshedClub as unknown as Club,
        });
      }
      
    } catch (error) {
      console.error('Error updating club:', error);
      toast.error('Failed to update club details');
    } finally {
      setSavingChanges(false);
    }
  };
  
  // Generate new join code
  const generateNewJoinCode = async () => {
    if (!club) return;
    
    try {
      // Generate a random 8-character alphanumeric code
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { error } = await supabase
        .from('clubs')
        .update({ join_code: randomCode })
        .eq('id', club.id);
        
      if (error) throw error;
      
      setFormValues(prev => ({ ...prev, join_code: randomCode }));
      setClub(prev => prev ? { ...prev, join_code: randomCode } : null);
      toast.success('New join code generated');
      
    } catch (error) {
      console.error('Error generating join code:', error);
      toast.error('Failed to generate new join code');
    }
  };
  
  // Copy join code to clipboard
  const copyJoinCode = () => {
    if (!formValues.join_code) return;
    
    navigator.clipboard.writeText(formValues.join_code);
    setIsJoinCodeCopied(true);
    toast.success('Join code copied to clipboard');
    
    setTimeout(() => {
      setIsJoinCodeCopied(false);
    }, 3000);
  };
  
  // Handle change role for a member
  const handleChangeRole = async () => {
    if (!selectedMember || !newRole) return;
    
    try {
      // Don't allow changing role of the creator
      if (selectedMember.role === 'creator') {
        toast.error('Cannot change the role of the club creator');
        return;
      }
      
      // Update member role
      const { error } = await supabase
        .from('club_memberships')
        .update({ role: newRole })
        .eq('club_id', selectedMember.club_id)
        .eq('user_id', selectedMember.user_id);
        
      if (error) throw error;
      
      // Update local state
      setMembers(prevMembers => prevMembers.map(member => 
        member.user_id === selectedMember.user_id && member.club_id === selectedMember.club_id
          ? { ...member, role: newRole as MemberRole } 
          : member
      ));
      
      toast.success(`${selectedMember.user.first_name}'s role updated to ${newRole}`);
      setShowChangeRoleDialog(false);
      
    } catch (error) {
      console.error('Error changing member role:', error);
      toast.error('Failed to update member role');
    }
  };
  
  // Handle removing a member
  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    try {
      // Don't allow removing the creator
      if (selectedMember.role === 'creator') {
        toast.error('Cannot remove the club creator');
        return;
      }
      
      // Remove member
      const { error } = await supabase
        .from('club_memberships')
        .delete()
        .eq('club_id', selectedMember.club_id)
        .eq('user_id', selectedMember.user_id);
        
      if (error) throw error;
      
      // Update local state
      setMembers(prevMembers => prevMembers.filter(member => 
        !(member.user_id === selectedMember.user_id && member.club_id === selectedMember.club_id)
      ));
      
      toast.success(`${selectedMember.user.first_name} removed from the club`);
      setShowRemoveMemberDialog(false);
      
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };
  
  // Handle club deletion
  const handleDeleteClub = async () => {
    if (!club || !user) return;
    
    try {
      await deleteClub(club.id);
      toast.success('Club deleted successfully');
      navigate('/clubs');
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club');
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <div className="grid gap-4 grid-cols-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container max-w-5xl mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{club?.name}</h1>
          <p className="text-muted-foreground">
            Club Management
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/clubs/${clubId}`)}>
          <X className="mr-2 h-4 w-4" />
          Back to Club
        </Button>
      </div>
      
      <Tabs defaultValue="details">
        <TabsList className="mb-6">
          <TabsTrigger value="details">
            <Settings className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Club Details</CardTitle>
                <CardDescription>
                  Edit your club's information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Club Name</Label>
                    <Input
                      id="name"
                      value={formValues.name}
                      onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="course_code">Course Code (Optional)</Label>
                    <Input
                      id="course_code"
                      value={formValues.course_code}
                      onChange={(e) => setFormValues({ ...formValues, course_code: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={5}
                    value={formValues.description}
                    onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formValues.tags}
                    onChange={(e) => setFormValues({ ...formValues, tags: e.target.value })}
                    placeholder="academic, study, social"
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select
                      value={formValues.visibility}
                      onValueChange={(value) => setFormValues({ 
                        ...formValues, 
                        visibility: value as ClubVisibility 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center">
                            <Unlock className="mr-2 h-4 w-4" />
                            Public (Anyone can view)
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center">
                            <Lock className="mr-2 h-4 w-4" />
                            Private (Join code required)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="join_code">Join Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="join_code"
                        value={formValues.join_code}
                        readOnly
                        className="font-mono"
                      />
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="outline"
                        onClick={copyJoinCode}
                      >
                        {isJoinCodeCopied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={generateNewJoinCode}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Club
                </Button>
                
                <Button type="submit" disabled={savingChanges}>
                  {savingChanges ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Club Members</CardTitle>
              <CardDescription>
                Manage club members and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={`${member.club_id}-${member.user_id}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-9 w-9 mr-3">
                        <AvatarImage src={member.user.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.user.first_name?.[0]}{member.user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.user.first_name} {member.user.last_name}
                          {member.user.id === user?.id && (
                            <span className="text-xs text-muted-foreground ml-2">(You)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        member.role === 'creator' 
                          ? 'default' 
                          : member.role === 'admin' 
                            ? 'secondary'
                            : 'outline'
                      }>
                        {member.role === 'creator' && (
                          <Shield className="mr-1 h-3 w-3" />
                        )}
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                      
                      {/* Don't show controls for self or creator */}
                      {member.user.id !== user?.id && member.role !== 'creator' && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedMember(member);
                              setNewRole(member.role);
                              setShowChangeRoleDialog(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSelectedMember(member);
                              setShowRemoveMemberDialog(true);
                            }}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {members.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No members found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Club Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this club? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start mt-4 p-4 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-6 w-6 text-destructive mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Warning</p>
              <p className="text-sm text-muted-foreground mt-1">
                Deleting this club will remove all members, meetups, and messages associated with it.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClub}
            >
              Delete Club
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Change Role Dialog */}
      <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedMember?.user.first_name} {selectedMember?.user.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Label htmlFor="role">Select Role</Label>
            <Select
              value={newRole}
              onValueChange={setNewRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChangeRoleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeRole}
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Remove Member Dialog */}
      <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.user.first_name} {selectedMember?.user.last_name} from the club?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowRemoveMemberDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
            >
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ClubManagementPage; 