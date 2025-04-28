import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversation } from '@/contexts/ConversationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, User, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { debounce } from 'lodash';
import { ConversationType } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { isMatchId } from '@/utils/matchHelpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    conversations, 
    fetchConversations, 
    loadingConversations,
    loading,
    getConversationsWithProfiles,
    refreshConversations
  } = useConversation();
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [conversationsWithProfiles, setConversationsWithProfiles] = useState<any[]>([]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    const fullName = `${conversation.otherUser.first_name} ${conversation.otherUser.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Handle refresh conversations
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      await refreshConversations();
      const conversationsWithProfiles = await getConversationsWithProfiles();
      console.log('Refreshed conversations:', conversationsWithProfiles.length);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
      setError('Failed to refresh conversations. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to refresh conversations. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshConversations, getConversationsWithProfiles, toast]);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      if (user) {
        await fetchConversations();
        
        // Also load conversations with profiles
        const conversationsWithProfilesData = await getConversationsWithProfiles();
        setConversationsWithProfiles(conversationsWithProfilesData);
      }
    };
    
    loadConversations();
  }, [user, fetchConversations, getConversationsWithProfiles]);

  // Handle search input change with debounce
  const handleSearchChange = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  // Verify and navigate to chat
  const verifyAndNavigateToChat = useCallback(async (conversationOrMatchId: string) => {
    if (!conversationOrMatchId) {
      console.error('No ID provided for chat navigation');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      console.log('Verifying before navigation:', conversationOrMatchId);
      
      // First, check if this is a conversation ID
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*, match:match_id(*)')
        .eq('id', conversationOrMatchId)
        .limit(1);
        
      if (convError) throw convError;
      
      if (conversations && conversations.length > 0) {
        // This is a conversation ID
        const conversation = conversations[0];
        const matchId = conversation.match_id;
        
        if (matchId) {
          console.log('Found conversation, navigating to match:', matchId);
          navigate(`/chat/${matchId}`);
          return;
        }
      }
      
      // If not a conversation, check if it's a valid match ID
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', conversationOrMatchId)
        .limit(1);
        
      if (matchError) throw matchError;
      
      if (matches && matches.length > 0) {
        // This is a valid match ID
        console.log('Valid match ID, navigating:', conversationOrMatchId);
        navigate(`/chat/${conversationOrMatchId}`);
        return;
      }
      
      // If we get here, the ID is neither a valid conversation nor match
      console.error('Invalid ID for chat navigation:', conversationOrMatchId);
      setError('Cannot open this chat. The conversation may have been deleted.');
    } catch (error) {
      console.error('Error verifying chat ID:', error);
      setError('Error opening chat. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [navigate]);

  // Handle conversation click
  const handleConversationClick = useCallback((conversation: ConversationType) => {
    // Don't use the conversation ID directly
    // Instead, use the match_id if available
    const idToUse = conversation.match_id || conversation.id;
    
    console.log('Chat clicked for:', conversation);
    console.log('Using ID for navigation:', idToUse);
    
    verifyAndNavigateToChat(idToUse);
  }, [verifyAndNavigateToChat]);

  // Helper function to get the other user in a match
  const getOtherUser = useCallback((conversation: any) => {
    if (!conversation || !conversation.match) return null;
    
    const currentUserId = user?.id;
    if (!currentUserId) return null;
    
    if (conversation.match.user1_id === currentUserId) {
      return {
        id: conversation.match.user2_id,
        profile: conversation.user2Profile
      };
    } else {
      return {
        id: conversation.match.user1_id,
        profile: conversation.user1Profile
      };
    }
  }, [user]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="bg-background border-b p-4">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing || loadingConversations}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 m-4 rounded-md flex items-center">
          <AlertCircle size={18} className="mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {loadingConversations || isVerifying ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageSquare size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'No conversations match your search.' 
                : 'Start a conversation with your matches to chat.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/matches')}>
                View Matches
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => {
              // Find the corresponding conversation with profiles
              const conversationWithProfiles = conversationsWithProfiles.find(
                c => c.id === conversation.id
              );
              
              // Get the other user's profile
              const otherUser = conversationWithProfiles 
                ? getOtherUser(conversationWithProfiles)
                : null;
              
              // Use profile data if available, otherwise fall back to conversation.otherUser
              const displayName = otherUser?.profile
                ? `${otherUser.profile.first_name || ''} ${otherUser.profile.last_name || ''}`
                : `${conversation.otherUser.first_name} ${conversation.otherUser.last_name}`;
                
              const avatarUrl = otherUser?.profile?.avatar_url || conversation.otherUser.avatar_url;
              
              return (
                <div
                  key={conversation.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={24} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium truncate">
                        {displayName}
                      </h3>
                      {conversation.last_message && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
