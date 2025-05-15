import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMatching } from '@/contexts/matching';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, RotateCcw, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// The type used for match weights
interface MatchWeights {
  location: number;
  interests: number;
  languages: number;
  goals: number;
  availability: number;
  personality: number;
  network: number;
}

// New interface for modal dialog version
interface MatchingPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

// The modal dialog version for SmartMatchingPage
export const MatchingPreferences = ({
  isOpen,
  onClose,
  onSave
}: MatchingPreferencesModalProps) => {
  const { matchPreferences, updateMatchPreference, resetMatchPreferences, loading } = useMatching();
  
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

  const getWeightPercent = (weight: number) => {
    return Math.round(weight * 100);
  };

  const handleSliderChange = async (factor: keyof MatchWeights, value: number[]) => {
    if (updateMatchPreference) {
      await updateMatchPreference(factor, value[0] / 100);
    }
  };

  const handleReset = async () => {
    if (resetMatchPreferences) {
      await resetMatchPreferences();
    }
  };

  const handleSave = () => {
    onSave();
  };

  if (!matchPreferences) {
    return null; // Don't render anything if preferences aren't loaded yet
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Matching Preferences</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {factors.map(({ key, label, icon }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">
                  {icon} {label}
                </label>
                <span className="text-sm text-muted-foreground">
                  {getWeightPercent(matchPreferences[key])}%
                </span>
              </div>
              <Slider
                defaultValue={[matchPreferences[key] * 100]}
                max={100}
                step={1}
                disabled={loading}
                onValueCommit={(value) => handleSliderChange(key, value)}
                className="cursor-pointer"
              />
            </div>
          ))}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
            className="flex gap-2"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 