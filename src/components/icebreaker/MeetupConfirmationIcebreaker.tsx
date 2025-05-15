import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { IcebreakerCard } from '@/components/icebreaker/IcebreakerCard';
import { useIcebreakers } from '@/hooks/use-icebreakers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MeetupConfirmationIcebreakerProps {
  meetup: any;
  userA: any; 
  userB: any;
}

export const MeetupConfirmationIcebreaker = ({ 
  meetup, 
  userA, 
  userB 
}: MeetupConfirmationIcebreakerProps) => {
  const [copied, setCopied] = React.useState(false);
  const { icebreakers, isLoading, generateSuggestions } = useIcebreakers({
    userA,
    userB,
    meetingDate: meetup.date ? new Date(meetup.date).toLocaleDateString() : 'Your upcoming meetup',
    location: meetup.location_name || 'Campus meetup'
  });
  const { toast } = useToast();

  // Generate icebreakers when the component mounts
  useEffect(() => {
    if (!icebreakers && !isLoading && userA && userB) {
      generateSuggestions();
    }
  }, [userA, userB, icebreakers, isLoading, generateSuggestions]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  if (!icebreakers && !isLoading) return null;

  const handleCopyToClipboard = () => {
    if (!icebreakers) return;
    
    // Format the icebreakers for clipboard
    const icebreakersText = `
🧊 ICEBREAKERS FOR MY MEETUP WITH ${userB.full_name || userB.first_name || 'my match'}

💬 Conversation Starters:
${icebreakers.conversationStarters.map((s, i) => `${i + 1}. ${s}`).join('\n')}

🎲 Mini-Activity:
${icebreakers.activity}

🔍 Shared Topic to Explore:
${icebreakers.sharedTopic}
    `.trim();
    
    navigator.clipboard.writeText(icebreakersText);
    setCopied(true);
    
    toast({
      title: 'Copied to clipboard!',
      description: 'Icebreakers have been copied to your clipboard.'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-md border-dashed overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <span>Prepare for Your Meetup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Here are some personalized conversation starters to help you break the ice and make your meetup with{' '}
            <span className="font-medium">{userB.full_name || userB.first_name || 'your match'}</span> more enjoyable!
          </p>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500 mr-3" />
              <span>Generating personalized icebreakers...</span>
            </div>
          ) : icebreakers ? (
            <>
              <IcebreakerCard 
                icebreaker={icebreakers}
                onRefresh={generateSuggestions}
                className="mb-4"
              />
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyToClipboard}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy to clipboard</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MeetupConfirmationIcebreaker; 