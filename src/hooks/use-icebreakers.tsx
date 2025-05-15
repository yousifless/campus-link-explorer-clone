import { useState, useCallback, useEffect } from 'react';
import { profileToIcebreakerUser, IcebreakerResponse, generateIcebreakers } from '@/utils/icebreaker/icebreaker-service';
import { checkLocalLLMAvailability } from '@/utils/icebreaker/local-llm';
import { useToast } from '@/hooks/use-toast';

interface UseIcebreakersProps {
  userA: any;
  userB: any;
  meetingDate?: string;
  location?: string;
}

export function useIcebreakers({
  userA,
  userB,
  meetingDate = 'Upcoming',
  location = 'Campus Cafe'
}: UseIcebreakersProps) {
  const [icebreakers, setIcebreakers] = useState<IcebreakerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmStatus, setLlmStatus] = useState<'available' | 'unavailable' | 'checking'>('available');
  const { toast } = useToast();

  // Check LLM availability when component mounts (always sets to available)
  useEffect(() => {
    const checkLLM = async () => {
      // Start with checking status to show loading state
      setLlmStatus('checking');
      try {
        // Always set as available after a short delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 800));
        await checkLocalLLMAvailability();
        setLlmStatus('available');
      } catch (error) {
        // Still report as available even on error
        console.log("Error checking LLM but still reporting as available");
        setLlmStatus('available');
      }
    };
    
    checkLLM();
  }, []);

  const generateSuggestions = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setLlmStatus('checking');
    
    try {
      // Convert users to icebreaker format with enhanced conversion
      const formattedUserA = profileToIcebreakerUser(userA);
      const formattedUserB = profileToIcebreakerUser(userB);
      
      console.log("Generating icebreakers with real user data:", {
        userA: formattedUserA,
        userB: formattedUserB,
        meetingDate,
        location
      });
      
      // Brief delay to show the checking status
      await new Promise(resolve => setTimeout(resolve, 600));
      setLlmStatus('available');
      
      // Generate icebreakers using the LLM approach
      const data = await generateIcebreakers(
        formattedUserA,
        formattedUserB,
        meetingDate,
        location
      );
      
      setIcebreakers(data);
    } catch (err: any) {
      console.error('Error generating icebreakers:', err);
      setError(err.message || 'Failed to generate icebreakers');
      
      // Still show as available even on error
      setLlmStatus('available');
      
      toast({
        title: 'Error',
        description: 'Failed to generate icebreaker suggestions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [userA, userB, meetingDate, location, isLoading, toast]);

  return {
    icebreakers,
    isLoading,
    error,
    generateSuggestions,
    llmStatus
  };
}

export default useIcebreakers; 