
import React, { useEffect } from 'react';
import { useMatching } from '@/contexts/MatchingContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Check, X, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const MatchCard = ({ match, isPending = false, onAccept, onReject, onMessage }) => {
  const isUser1 = match.user1_id === match.otherUser.id;
  const userStatus = isUser1 ? match.user1_status : match.user2_status;
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {match.otherUser.avatar_url ? (
              <img
                src={match.otherUser.avatar_url}
                alt={`${match.otherUser.first_name} ${match.otherUser.last_name}`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User size={24} className="text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-medium">
              {match.otherUser.first_name} {match.otherUser.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {match.otherUser.university || "University not specified"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm line-clamp-2 mb-3">
          {match.otherUser.bio || "No bio provided."}
        </p>
        
        {isPending ? (
          userStatus === 'pending' ? (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={onReject}
              >
                <X size={16} className="mr-1" />
                Decline
              </Button>
              <Button 
                size="sm" 
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={onAccept}
              >
                <Check size={16} className="mr-1" />
                Accept
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Waiting for response...
            </div>
          )
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onMessage}
          >
            <MessageSquare size={16} className="mr-2" />
            Message
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const Matches = () => {
  const { matches, fetchMatches, respondToMatch, loading } = useMatching();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const pendingMatches = matches.filter(match => match.status === 'pending');
  const acceptedMatches = matches.filter(match => match.status === 'accepted');

  const handleAccept = async (matchId) => {
    await respondToMatch(matchId, 'accept');
  };

  const handleReject = async (matchId) => {
    await respondToMatch(matchId, 'reject');
  };

  const handleMessage = (matchId) => {
    // Find the conversation associated with this match
    const match = matches.find(m => m.id === matchId);
    if (match) {
      navigate(`/chat/${matchId}`);
    }
  };

  if (loading && matches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Matches</h2>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Your Matches</h2>
      
      <Tabs defaultValue="accepted" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="accepted" className="flex-1">
            Connected ({acceptedMatches.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">
            Pending ({pendingMatches.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="accepted">
          {acceptedMatches.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No matches yet</h3>
              <p className="text-muted-foreground mb-4">
                Visit the Discover tab to find and connect with other students.
              </p>
              <Button onClick={() => navigate('/feed')}>Discover Students</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {acceptedMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onMessage={() => handleMessage(match.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending">
          {pendingMatches.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No pending requests</h3>
              <p className="text-muted-foreground">
                When you send or receive connection requests, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isPending={true}
                  onAccept={() => handleAccept(match.id)}
                  onReject={() => handleReject(match.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Matches;
