import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MatchWeights } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, RotateCcw, Save, Loader2, Coffee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_WEIGHTS, normalizeWeights } from '@/utils/matching/hybridMatchingAlgorithm';

export const MeetupPreferences = () => {
  // Load the open state from localStorage, default to true for first-time users
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('meetupPreferencesOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [weights, setWeights] = useState<MatchWeights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Save the open state whenever it changes
  useEffect(() => {
    localStorage.setItem('meetupPreferencesOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_match_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 is "Row not found" error
            throw error;
          }
          // If no preferences found, use defaults
          setWeights(DEFAULT_WEIGHTS);
          return;
        }
        
        if (data) {
          setWeights({
            location: data.location,
            interests: data.interests,
            languages: data.languages,
            goals: data.goals,
            availability: data.availability,
            personality: data.personality,
            network: data.network
          });
        } else {
          setWeights(DEFAULT_WEIGHTS);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your matching preferences',
          variant: 'destructive',
        });
        setWeights(DEFAULT_WEIGHTS);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPreferences();
  }, [user?.id, toast]);

  const handleSliderChange = async (factor: keyof MatchWeights, value: number[]) => {
    if (!weights) return;
    
    const newValue = value[0] / 100; // Convert from percentage
    
    // Update local state immediately for UI responsiveness
    setWeights(prevWeights => {
      if (!prevWeights) return null;
      return {
        ...prevWeights,
        [factor]: newValue
      };
    });
  };

  const savePreferences = async () => {
    if (!user?.id || !weights) return;
    
    setIsSaving(true);
    try {
      // Normalize weights to ensure they sum to 1
      const normalizedWeights = normalizeWeights(weights);
      
      // Save to database with proper onConflict handling
      const { error } = await supabase
        .from('user_match_preferences')
        .upsert({
          user_id: user.id,
          location: normalizedWeights.location,
          interests: normalizedWeights.interests,
          languages: normalizedWeights.languages,
          goals: normalizedWeights.goals,
          availability: normalizedWeights.availability,
          personality: normalizedWeights.personality,
          network: normalizedWeights.network,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }); // Specify the column to determine uniqueness
      
      if (error) throw error;
      
      setWeights(normalizedWeights);
      toast({
        title: 'Success',
        description: 'Your matching preferences have been saved',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your matching preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setWeights(DEFAULT_WEIGHTS);
    if (user?.id) {
      await savePreferences();
    }
  };

  const getWeightPercent = (weight: number) => {
    return Math.round(weight * 100);
  };

  // Slider props for each factor
  const factors: Array<{ key: keyof MatchWeights; label: string; icon: string }> = [
    { key: 'location', label: 'Location', icon: '📍' },
    { key: 'interests', label: 'Interests', icon: '🎯' },
    { key: 'languages', label: 'Languages', icon: '🗣️' },
    { key: 'goals', label: 'Goals', icon: '🎯' },
    { key: 'availability', label: 'Availability', icon: '📅' },
    { key: 'personality', label: 'Personality', icon: '🧠' },
    { key: 'network', label: 'Network', icon: '🔗' }
  ];

  if (!weights) {
    return (
      <Card className="w-full mb-4 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Coffee className="h-5 w-5 mr-2" />
            Matching Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-4 shadow-sm">
      <CardHeader className="pb-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full py-2 flex items-center justify-between rounded-lg"
        >
          <CardTitle className="text-lg font-semibold flex items-center">
            <Coffee className="h-5 w-5 mr-2" />
            Matching Preferences
          </CardTitle>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </CardHeader>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Adjust how much each factor matters when finding your perfect connections
              </p>
              
              <div className="space-y-4">
                {factors.map(({ key, label, icon }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">
                        {icon} {label}
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {getWeightPercent(weights[key])}%
                      </span>
                    </div>
                    <Slider
                      defaultValue={[weights[key] * 100]}
                      value={[weights[key] * 100]}
                      max={100}
                      step={1}
                      disabled={isLoading}
                      onValueChange={(value) => handleSliderChange(key, value)}
                      className="cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  disabled={isLoading || isSaving}
                  className="flex gap-2"
                >
                  <RotateCcw size={16} />
                  Reset
                </Button>
                
                <Button
                  size="sm"
                  onClick={savePreferences}
                  disabled={isLoading || isSaving}
                  className="flex gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default MeetupPreferences; 