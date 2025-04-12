
import React, { useEffect } from 'react';
import { useMatching } from '@/contexts/matching';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import MatchCard from '@/components/matches/MatchCard';

const Matches = () => {
  const { matches, fetchMatches, acceptMatch, rejectMatch, loading } = useMatching();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const pendingMatches = matches.filter(match => match.status === 'pending');
  const acceptedMatches = matches.filter(match => match.status === 'accepted');

  const handleAccept = async (matchId: string) => {
    await acceptMatch(matchId);
  };

  const handleReject = async (matchId: string) => {
    await rejectMatch(matchId);
  };

  const handleMessage = (matchId: string) => {
    navigate(`/chat/${matchId}`);
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
                  onMessage={() => {}}
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
