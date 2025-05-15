import React, { useEffect, useState } from 'react';
import { IcebreakerCard } from '@/components/icebreaker/IcebreakerCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb } from 'lucide-react';
import { LlmStatus } from './LlmStatus';
import { IcebreakerResponse, generateIcebreakersForMatch } from '@/utils/icebreaker/icebreaker-service';
import { useToast } from '@/hooks/use-toast';

interface MatchIcebreakerProps {
  matchId: string;
  locationName?: string;
}

/**
 * Component to generate icebreakers based on a match ID
 * Fetches real user data from the database for personalization
 */
export const MatchIcebreaker = ({ matchId, locationName }: MatchIcebreakerProps) => {
  const [icebreakers, setIcebreakers] = useState<IcebreakerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmStatus, setLlmStatus] = useState<'available' | 'unavailable' | 'checking'>('available');
  const { toast } = useToast();

  const generateSuggestions = async () => {
    if (isLoading || !matchId) return;
    
    setIsLoading(true);
    setLlmStatus('checking');
    setError(null);
    
    // Track start time for minimum loading time
    const startTime = Date.now();
    
    try {
      console.log(`Generating icebreakers for match ID: ${matchId}`);
      
      // Generate icebreakers using real user data from the database
      const data = await generateIcebreakersForMatch(matchId);
      
      // Set a short delay to show the loading state for better UX
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 1200 - (Date.now() - startTime))));
      
      setIcebreakers(data);
      setLlmStatus('available');
      
      console.log("Generated icebreakers with real user data:", data);
    } catch (err: any) {
      console.error('Error generating match icebreakers:', err);
      setError(err.message || 'Failed to generate icebreakers');
      
      // Still show as available even on error for consistency
      setLlmStatus('available');
      
      toast({
        title: 'Error',
        description: 'Failed to generate icebreaker suggestions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate icebreakers when the component mounts or match ID changes
  useEffect(() => {
    if (matchId) {
      generateSuggestions();
    }
  }, [matchId]);

  if (!matchId) return null;

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
                ? 'Fetching user data and initializing DistilGPT-2...' 
                : 'Generating personalized icebreakers with DistilGPT-2...'}
            </span>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">
            <p>Error: {error}</p>
            <button 
              className="mt-2 text-sm underline text-amber-600"
              onClick={() => generateSuggestions()}
            >
              Try Again
            </button>
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

export default MatchIcebreaker; 