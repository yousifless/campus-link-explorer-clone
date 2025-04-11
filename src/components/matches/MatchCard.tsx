
import React from 'react';
import { MatchType } from '@/contexts/MatchingContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface MatchCardProps {
  match: MatchType;
  isPending?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage: () => void;
}

const MatchCard = ({ match, isPending = false, onAccept, onReject, onMessage }: MatchCardProps) => {
  const { user } = useAuth();
  
  const isRequestSent = 
    (match.user1_id === user?.id && match.user1_status === 'accepted' && match.user2_status === 'pending') ||
    (match.user2_id === user?.id && match.user2_status === 'accepted' && match.user1_status === 'pending');
  
  const isRequestReceived = 
    (match.user1_id === user?.id && match.user1_status === 'pending' && match.user2_status === 'accepted') ||
    (match.user2_id === user?.id && match.user2_status === 'pending' && match.user1_status === 'accepted');

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={match.otherUser.avatar_url || undefined} alt={match.otherUser.first_name} />
            <AvatarFallback>
              {match.otherUser.first_name.charAt(0)}
              {match.otherUser.last_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-medium">
              {match.otherUser.first_name} {match.otherUser.last_name}
            </h3>
            {match.otherUser.university && (
              <p className="text-sm text-gray-500">{match.otherUser.university}</p>
            )}
            {isPending && (
              <Badge variant="outline" className="mt-1">
                {isRequestSent ? 'Request Sent' : 'Request Received'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        {isPending ? (
          isRequestReceived ? (
            <>
              <Button 
                variant="default" 
                className="flex-1" 
                onClick={onAccept}
              >
                Accept
              </Button>
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={onReject}
              >
                Decline
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              disabled
              className="w-full"
            >
              Pending Response
            </Button>
          )
        ) : (
          <Button 
            variant="default" 
            className="w-full" 
            onClick={onMessage}
          >
            Message
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MatchCard;
