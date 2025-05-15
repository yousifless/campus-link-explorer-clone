import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useClubs } from '@/hooks/useClubs';
import { Club, ClubMeetup, ClubMembership, ClubMessage } from '@/types/clubs';
import ClubAnalytics from '@/components/clubs/ClubAnalytics';
import ClubResources from '@/components/clubs/ClubResources';
import ClubMeetupCard from '@/components/clubs/ClubMeetupCard';
import ClubChatWindow from '@/components/clubs/ClubChatWindow';

// UI Components
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Icons
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Plus, 
  LogOut, 
  Trash2, 
  UserPlus, 
  Copy, 
  Check, 
  Book, 
  Lock, 
  UnlockIcon,
  FileText,
  BarChart3
} from 'lucide-react';

const ClubDetailPage = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leaveClub, deleteClub } = useClubs();
  
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMembership[]>([]);
  const [meetups, setMeetups] = useState<ClubMeetup[]>([]);
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [isJoinCodeCopied, setIsJoinCodeCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Fetch club details
  useEffect(() => {
    if (!clubId || !user) return;
    
    const fetchClubDetails = async () => {
      try {
        setLoading(true);
        
        // Get club details - remove references to banner_url and logo_url if they don't exist
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
        const club = {
          ...clubData,
          creator_first_name: clubData.creator?.first_name,
          creator_last_name: clubData.creator?.last_name,
          creator_avatar_url: clubData.creator?.avatar_url,
          member_count: clubData.member_count?.[0]?.count || 0
        };
        
        setClub(club as Club);
        
        // Get user role in the club
        const { data: memberData, error: memberError } = await supabase
          .from('club_memberships')
          .select('role')
          .eq('club_id', clubId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (!memberError && memberData) {
          setUserRole(memberData.role as string);
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
              first_name, 
              last_name, 
              avatar_url
            )
          `)
          .eq('club_id', clubId);
          
        if (membersError) throw membersError;
        
        setMembers(membersData as ClubMembership[]);
        
        // Get upcoming meetups
        const { data: meetupsData, error: meetupsError } = await supabase
          .from('club_meetups')
          .select(`
            id, 
            club_id, 
            title, 
            description, 
            date, 
            time, 
            location_name, 
            location_address,
            location_lat,
            location_lng,
            created_by,
            created_at,
            creator:profiles!club_meetups_created_by_fkey(
              first_name, 
              last_name, 
              avatar_url
            )
          `)
          .eq('club_id', clubId)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true });
          
        if (meetupsError) throw meetupsError;
        
        setMeetups(meetupsData as ClubMeetup[]);
        
        // Get recent messages if user is a member
        if (userRole) {
          const { data: messagesData, error: messagesError } = await supabase
            .from('club_messages')
            .select(`
              id, 
              club_id, 
              content, 
              created_at, 
              sender_id,
              sender:profiles!club_messages_sender_id_fkey(
                first_name, 
                last_name, 
                avatar_url
              )
            `)
            .eq('club_id', clubId)
            .order('created_at', { ascending: false })
            .limit(50);
            
          if (messagesError) throw messagesError;
          
          setMessages(messagesData.reverse() as ClubMessage[]);
          
          // Subscribe to new messages
          const clubMessagesSubscription = supabase
            .channel('club_messages')
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'club_messages',
              filter: `club_id=eq.${clubId}`
            }, payload => {
              setMessages(current => [...current, payload.new as ClubMessage]);
            })
            .subscribe();
            
          return () => {
            supabase.removeChannel(clubMessagesSubscription);
          };
        }
      } catch (err) {
        console.error('Error fetching club details:', err);
        toast.error('Failed to load club details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClubDetails();
  }, [clubId, user, userRole]);
  
  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !club || !user) return;
    
    try {
      const { error } = await supabase
        .from('club_messages')
        .insert({
          club_id: club.id,
          content: message.trim(),
          sender_id: user.id
        });
        
      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  };
  
  // Handle leaving the club
  const handleLeaveClub = async () => {
    if (!club) return;
    
    const success = await leaveClub(club.id);
    if (success) {
      navigate('/clubs');
    }
  };
  
  // Handle deleting the club
  const handleDeleteClub = async () => {
    if (!club) return;
    
    const success = await deleteClub(club.id);
    if (success) {
      navigate('/clubs');
    }
  };
  
  // Copy join code to clipboard
  const copyJoinCode = () => {
    if (!club?.join_code) return;
    
    navigator.clipboard.writeText(club.join_code);
    setIsJoinCodeCopied(true);
    toast.success('Join code copied to clipboard');
    
    setTimeout(() => {
      setIsJoinCodeCopied(false);
    }, 3000);
  };
  
  // Calculate the number of admins in the club
  const adminCount = members.filter(m => m.role === 'admin').length;
  
  // Determine if the current user is the creator
  const isCreator = club?.created_by === user?.id;
  
  // Determine if the current user is an admin
  const isAdmin = userRole === 'admin';
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!club) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Club Not Found</h1>
        <p className="text-muted-foreground mb-6">This club either doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate('/clubs')}>Return to Clubs List</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Club Header */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{club.name}</h1>
            <Badge variant={club.visibility === 'private' ? "outline" : "secondary"} className="flex items-center text-xs">
              {club.visibility === 'private' ? (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </>
              ) : (
                <>
                  <UnlockIcon className="h-3 w-3 mr-1" />
                  Public
                </>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Created by {club.creator_first_name} {club.creator_last_name}</span>
            <span>•</span>
            <span>{club.member_count} members</span>
            {club.course_code && (
              <>
                <span>•</span>
                <span className="flex items-center">
                  <Book className="h-3 w-3 mr-1" />
                  {club.course_code}
                </span>
              </>
            )}
          </div>
          
          {club.tags && club.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {club.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs py-0 px-2">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {userRole ? (
            <>
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate(`/clubs/${club.id}/manage`)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Club
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleLeaveClub}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Club
              </Button>
              
              {isAdmin && adminCount > 1 && (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Club
                  </Button>
                  
                  <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Club</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this club? This action cannot be undone.
                          All club data including messages, meetups, and memberships will be permanently deleted.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteClub}>
                          Delete Club
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </>
          ) : (
            <Button onClick={() => navigate('/clubs')}>Browse Other Clubs</Button>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="about" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full md:w-auto">
          <TabsTrigger value="about" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">About</span>
          </TabsTrigger>
          <TabsTrigger value="meetups" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">Meetups</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-1" disabled={!userRole}>
            <MessageSquare className="h-4 w-4" />
            <span className="hidden md:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Resources</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1" disabled={!isAdmin}>
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>
        
        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About this Club</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">
                {club.description || "No description provided."}
              </p>
            </CardContent>
          </Card>
          
          {/* Join Code Card (for private clubs and admins only) */}
          {(club.visibility === 'private' && isAdmin) && (
            <Card>
              <CardHeader>
                <CardTitle>Club Join Code</CardTitle>
                <CardDescription>
                  Share this code with people you want to invite to your club
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 p-3 rounded-md font-mono text-lg tracking-wide flex-1">
                    {club.join_code}
                  </div>
                  <Button variant="outline" onClick={copyJoinCode}>
                    {isJoinCodeCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Meetups Tab */}
        <TabsContent value="meetups" className="space-y-6">
          {userRole && isAdmin && (
            <div className="flex justify-end mb-4">
              <Button onClick={() => navigate(`/clubs/${club.id}/meetups/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                New Meetup
              </Button>
            </div>
          )}
          
          {meetups.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground">No upcoming meetups scheduled.</p>
                {userRole && isAdmin && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate(`/clubs/${club.id}/meetups/new`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Meetup
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetups.map((meetup) => (
                <ClubMeetupCard 
                  key={meetup.id}
                  meetup={meetup}
                  clubId={club.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          {!userRole ? (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground">You need to be a member to access the club chat.</p>
              </CardContent>
            </Card>
          ) : (
            <ClubChatWindow
              clubName={club?.name || ''}
              messages={messages}
              loading={loading}
              onSend={handleSendMessage}
              userId={user?.id || null}
            />
          )}
        </TabsContent>
        
        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <ClubResources club={club} isAdmin={isAdmin} />
        </TabsContent>
        
        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          {userRole && isAdmin && (
            <div className="flex justify-end mb-4">
              <Button variant="outline" onClick={() => navigate(`/clubs/${club.id}/invite`)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user?.avatar_url || ''} />
                        <AvatarFallback>
                          {member.user?.first_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.user?.first_name} {member.user?.last_name}
                          {member.user_id === club.created_by && (
                            <span className="ml-2 text-xs text-muted-foreground">(Creator)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    
                    {isAdmin && member.user_id !== user?.id && (
                      <Button variant="ghost" size="sm">
                        {/* This would be connected to a "manage member" function */}
                        Manage
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <ClubAnalytics club={club} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubDetailPage; 