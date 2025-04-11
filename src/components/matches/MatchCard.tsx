
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatchType } from '@/types/database';
import { User, MessageSquare, Check, X } from 'lucide-react';

interface MatchCardProps {
  match: MatchType;
  isPending?: boolean;
  onAccept?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onMessage?: () => void;
}

const MatchCard = ({ match, isPending = false, onAccept, onReject, onMessage }: MatchCardProps) => {
  return (
    <Card className="w-full mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-row items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            {match.otherUser.avatar_url ? (
              <img
                src={match.otherUser.avatar_url}
                alt={`${match.otherUser.first_name} ${match.otherUser.last_name}`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User size={32} className="text-primary" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {match.otherUser.first_name} {match.otherUser.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {match.otherUser.university || "University not specified"}
              {match.otherUser.major && ` · ${match.otherUser.major}`}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row items-center">
            {isPending ? (
              <>
                {onAccept && (
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={onAccept}
                    className="w-full sm:w-auto"
                  >
                    <Check className="mr-1 h-4 w-4" /> Accept
                  </Button>
                )}
                {onReject && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onReject}
                    className="w-full sm:w-auto"
                  >
                    <X className="mr-1 h-4 w-4" /> Decline
                  </Button>
                )}
              </>
            ) : (
              onMessage && (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={onMessage}
                  className="w-full sm:w-auto"
                >
                  <MessageSquare className="mr-1 h-4 w-4" /> Message
                </Button>
              )
            )}
          </div>
        </div>
        
        {match.otherUser.bio && (
          <p className="text-sm mt-2">{match.otherUser.bio}</p>
        )}

        <div className="flex gap-2 mt-2">
          {match.otherUser.common_interests > 0 && (
            <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">
              {match.otherUser.common_interests} shared interests
            </span>
          )}
          {match.otherUser.common_languages > 0 && (
            <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">
              {match.otherUser.common_languages} shared languages
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
