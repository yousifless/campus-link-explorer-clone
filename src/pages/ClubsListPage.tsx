import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useClubs } from '@/hooks/useClubs';
import ClubCard from '@/components/clubs/ClubCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, X, Share2, Image, Upload, Copy, CheckCircle2, Sparkles } from 'lucide-react';
import { Club, ClubVisibility } from '@/types/clubs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/utils/supabase';
import { getColorFromText } from '@/utils/imageUtils';

const ClubsListPage = () => {
  const navigate = useNavigate();
  const { userClubs, publicClubs, loading, joinClub } = useClubs();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedClubForShare, setSelectedClubForShare] = useState<Club | null>(null);
  const [joinCodeCopied, setJoinCodeCopied] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'public' | 'private'>('all');
  
  // Filter clubs based on search query and filters
  const filteredPublicClubs = publicClubs.filter(club => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.description && club.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (club.tags && club.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'public' && club.visibility === ClubVisibility.PUBLIC) ||
      (typeFilter === 'private' && club.visibility === ClubVisibility.PRIVATE);
    return matchesSearch && matchesType;
  });
  
  const filteredUserClubs = userClubs.filter(club => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (club.description && club.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (club.tags && club.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'public' && club.visibility === ClubVisibility.PUBLIC) ||
      (typeFilter === 'private' && club.visibility === ClubVisibility.PRIVATE);
    return matchesSearch && matchesType;
  });
  
  // Handle view club details
  const handleViewClub = (clubId: string) => {
    navigate(`/clubs/${clubId}`);
  };
  
  // Handle join club
  const handleJoinClub = async (clubId: string) => {
    await joinClub(clubId);
  };
  
  // Open share dialog
  const handleShareClub = (club: Club) => {
    setSelectedClubForShare(club);
    setIsShareDialogOpen(true);
    setJoinCodeCopied(false);
  };
  
  // Copy club link to clipboard
  const copyClubLink = () => {
    if (!selectedClubForShare) return;
    
    const clubLink = `${window.location.origin}/clubs/${selectedClubForShare.id}`;
    navigator.clipboard.writeText(clubLink);
    
    toast.success("Club link copied to clipboard");
  };
  
  // Copy join code to clipboard
  const copyJoinCode = () => {
    if (!selectedClubForShare?.join_code) return;
    
    navigator.clipboard.writeText(selectedClubForShare.join_code);
    setJoinCodeCopied(true);
    
    setTimeout(() => {
      setJoinCodeCopied(false);
    }, 3000);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clubs & Group Meetups</h1>
          <p className="text-muted-foreground">Join clubs with shared interests or create your own</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/clubs/join')}
          >
            Join with Code
          </Button>
          
          <Button 
            className="bg-gradient-to-r from-blue-500 to-indigo-600"
            onClick={() => navigate('/clubs/new')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Club
          </Button>
        </div>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:gap-4 gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
          <Input
            className="pl-12 py-3 text-lg rounded-full shadow focus:ring-2 focus:ring-blue-400 border-blue-200 bg-white"
            placeholder="Search clubs by name, description, or tags"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search clubs"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Label htmlFor="typeFilter" className="sr-only">Type</Label>
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v as any)}>
            <SelectTrigger id="typeFilter" className="w-36 rounded-full border-blue-200 bg-white shadow">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          {/* TODO: Add more filters for activity/location if available */}
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Clubs</TabsTrigger>
          <TabsTrigger value="my">My Clubs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 0.5, scale: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="h-64 bg-gradient-to-br from-blue-100 via-blue-50 to-white animate-pulse rounded-2xl shadow-sm border border-blue-100"
                />
              ))}
            </div>
          ) : filteredPublicClubs.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {filteredPublicClubs.map((club, i) => (
                <motion.div 
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(80,80,180,0.12)' }}
                >
                  <ClubCard
                    club={club}
                    onView={handleViewClub}
                    onJoin={handleJoinClub}
                    onShare={() => handleShareClub(club)}
                    userIsMember={userClubs.some(c => c.id === club.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">No clubs found matching your search</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
                className="mx-auto"
              >
                Clear Search
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 0.5, scale: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="h-64 bg-gradient-to-br from-blue-100 via-blue-50 to-white animate-pulse rounded-2xl shadow-sm border border-blue-100"
                />
              ))}
            </div>
          ) : filteredUserClubs.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {filteredUserClubs.map((club) => (
                <motion.div 
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ClubCard
                    club={club}
                    onView={handleViewClub}
                    onJoin={handleJoinClub}
                    onShare={() => handleShareClub(club)}
                    userIsMember={true}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Sparkles className="h-16 w-16 text-blue-300 mb-4 animate-bounce" />
              <p className="text-2xl font-bold text-blue-700 mb-2">You haven't joined any clubs yet!</p>
              <p className="text-md text-blue-500 mb-6">Explore clubs or create your own to start connecting with others.</p>
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  onClick={() => setActiveTab('all')}
                  className="rounded-full px-6"
                >
                  Browse Clubs
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/clubs/new')}
                  className="rounded-full px-6"
                >
                  Create Club
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Share Club Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Club</DialogTitle>
            <DialogDescription>
              Share the link to invite others to join {selectedClubForShare?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link">Club Link</Label>
                <Input
                  id="link"
                  readOnly
                  value={selectedClubForShare ? `${window.location.origin}/clubs/${selectedClubForShare.id}` : ''}
                />
              </div>
              <Button type="button" size="icon" onClick={copyClubLink} className="px-3">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            {selectedClubForShare?.visibility === 'private' && selectedClubForShare.join_code && (
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="code" className="flex items-center gap-2">
                    Join Code
                    <Badge variant="outline" className="text-xs font-normal">Required for private clubs</Badge>
                  </Label>
                  <Input
                    id="code"
                    readOnly
                    value={selectedClubForShare.join_code}
                  />
                </div>
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={copyJoinCode} 
                  className="px-3"
                  variant={joinCodeCopied ? "secondary" : "default"}
                >
                  {joinCodeCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsShareDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubsListPage; 