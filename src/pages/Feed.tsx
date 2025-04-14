
import React, { useEffect, useState } from 'react';
import { useMatching } from '@/contexts/matching';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, X, Info, School, Globe, BookOpen, Users } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const MatchCard = ({ match, onLike, onSkip }) => {
  // Get initials safely, handling null values
  const getInitials = () => {
    const firstName = match.first_name || '';
    const lastName = match.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden shadow-lg">
      <CardHeader className="p-0">
        <div className="h-64 bg-gradient-to-b from-blue-400 to-blue-600 relative">
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {match.avatar_url ? (
              <img 
                src={match.avatar_url} 
                alt={`${match.first_name || 'User'} ${match.last_name || ''}`} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <span className="text-6xl font-bold">{getInitials()}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">
              {match.first_name || 'User'} {match.last_name || ''}
            </h2>
            {match.student_type && (
              <Badge className="mt-1">
                {match.student_type === 'international' ? 'International Student' : 'Local Student'}
              </Badge>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Info size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{match.first_name || 'User'} {match.last_name || ''}</SheetTitle>
                <SheetDescription>
                  {match.bio || "No bio provided."}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {match.university && (
                  <div className="flex items-center space-x-2">
                    <School size={18} />
                    <span>{match.university}</span>
                  </div>
                )}
                {match.major && (
                  <div className="flex items-center space-x-2">
                    <BookOpen size={18} />
                    <span>{match.major}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Globe size={18} />
                  <span>{match.student_type === 'international' ? 'International Student' : 'Local Student'}</span>
                </div>
                {match.common_interests > 0 && (
                  <div className="flex items-start space-x-2">
                    <Users size={18} className="mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">You have {match.common_interests} shared interests</p>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <School size={18} className="text-blue-500" />
            <span>{match.university || "University not specified"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen size={18} className="text-green-500" />
            <span>{match.major || "Major not specified"}</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-gray-600 line-clamp-3">
            {match.bio || "No bio provided."}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center space-x-6 p-6 pt-2">
        <Button 
          variant="outline" 
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-red-400 text-red-400 hover:bg-red-50 hover:text-red-500"
          onClick={onSkip}
        >
          <X size={24} />
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-green-400 text-green-400 hover:bg-green-50 hover:text-green-500"
          onClick={onLike}
        >
          <Heart size={24} />
        </Button>
      </CardFooter>
    </Card>
  );
};

const Feed = () => {
  const { suggestedMatches, fetchSuggestedMatches, createMatch, loading } = useMatching();
  const { profile } = useProfile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchSuggestedMatches();
    }
  }, [fetchSuggestedMatches, profile]);

  const handleLike = async () => {
    if (currentIndex >= suggestedMatches.length || processingAction) return;
    
    try {
      setProcessingAction(true);
      const match = suggestedMatches[currentIndex];
      await createMatch(match.id);
      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error('Error liking match:', error);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex >= suggestedMatches.length || processingAction) return;
    setCurrentIndex(currentIndex + 1);
  };

  if (loading && suggestedMatches.length === 0) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card className="w-full overflow-hidden shadow-lg">
          <CardHeader className="p-0">
            <Skeleton className="h-64 w-full" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center space-x-6 p-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
        <p className="mb-6">Please complete your profile to start matching with other students.</p>
        <Button asChild>
          <a href="/profile">Complete Profile</a>
        </Button>
      </div>
    );
  }

  if (suggestedMatches.length === 0 || currentIndex >= suggestedMatches.length) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">No More Matches</h2>
        <p className="mb-6">We're currently out of potential matches for you. Check back later!</p>
        <Button onClick={() => {
          setCurrentIndex(0);
          fetchSuggestedMatches();
        }}>
          Refresh
        </Button>
      </div>
    );
  }

  const currentMatch = suggestedMatches[currentIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Discover Students</h2>
      <MatchCard 
        match={currentMatch}
        onLike={handleLike}
        onSkip={handleSkip}
      />
    </div>
  );
};

export default Feed;
