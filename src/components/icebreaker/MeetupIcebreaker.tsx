import React, { useEffect } from 'react';
import { IcebreakerCard } from '@/components/icebreaker/IcebreakerCard';
import { useIcebreakers } from '@/hooks/use-icebreakers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb } from 'lucide-react';
import { LlmStatus } from './LlmStatus';

interface MeetupIcebreakerProps {
  meetup: any;
  userA: any;
  userB: any;
}

export const MeetupIcebreaker = ({ meetup, userA, userB }: MeetupIcebreakerProps) => {
  const { 
    icebreakers, 
    isLoading, 
    generateSuggestions,
    llmStatus 
  } = useIcebreakers({
    userA,
    userB,
    meetingDate: meetup.date ? new Date(meetup.date).toLocaleDateString() : 'Upcoming',
    location: meetup.location_name || 'Campus meetup'
  });

  // Generate icebreakers when the component mounts
  useEffect(() => {
    if (!icebreakers && !isLoading && userA && userB) {
      generateSuggestions();
    }
  }, [userA, userB, icebreakers, isLoading, generateSuggestions]);

  if (!icebreakers && !isLoading) return null;

  return (
    <Card className="mt-4 shadow-sm border-dashed overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <div className="flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
            Icebreakers for Your Meetup
          </div>
          <LlmStatus status={llmStatus} />
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500 mr-2" />
            <span className="text-sm text-muted-foreground">
              {llmStatus === 'checking' 
                ? 'Initializing DistilGPT-2...' 
                : 'Generating personalized icebreakers with DistilGPT-2...'}
            </span>
          </div>
        ) : icebreakers ? (
          <IcebreakerCard 
            icebreaker={icebreakers} 
            showTitle={false}
            onRefresh={generateSuggestions}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

export default MeetupIcebreaker; 