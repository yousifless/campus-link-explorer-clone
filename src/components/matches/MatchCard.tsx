
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Check, X, User } from 'lucide-react';
import { MatchType } from '@/types/database';

interface MatchCardProps {
  match: MatchType;
  isPending?: boolean;
  onAccept?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onMessage?: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, isPending = false, onAccept, onReject, onMessage }) => {
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

export default MatchCard;
