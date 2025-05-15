import React, { useState } from 'react';
import GlobalMatchCard from './GlobalMatchCard';
import { HybridMatchScore } from '@/utils/matching/hybridMatchingAlgorithm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface HybridMatchCardProps {
  match: HybridMatchScore;
  onAccept: (userId: string) => void;
  onReject: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

export const HybridMatchCard = ({
  match,
  onAccept,
  onReject,
  onMessage
}: HybridMatchCardProps) => {
  const { 
    userId, 
    totalScore, 
    profile, 
    explanationFactors 
  } = match;

  // Format score as percentage
  const scorePercent = Math.round(totalScore * 100);
  
  // Wrap callbacks in promise-returning functions for GlobalMatchCard
  const handleAccept = async (id: string): Promise<void> => {
    return onAccept(id);
  };

  const handleReject = async (id: string): Promise<void> => {
    return onReject(id);
  };

  // Render score bars for the match details dialog
  const renderScoreBars = () => {
    const factors = [
      { key: 'location', label: 'Location', icon: '📍' },
      { key: 'interests', label: 'Interests', icon: '🎯' },
      { key: 'languages', label: 'Languages', icon: '🗣️' },
      { key: 'goals', label: 'Goals', icon: '🎯' },
      { key: 'availability', label: 'Availability', icon: '📅' },
      { key: 'personality', label: 'Personality', icon: '🧠' },
      { key: 'network', label: 'Network', icon: '🔗' }
    ];

    return (
      <div className="space-y-3 mt-4">
        {factors.map(({ key, label, icon }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1">
                {icon}
                <span>{label}</span>
              </div>
              <span>{Math.round(explanationFactors[key as keyof typeof explanationFactors] * 100)}%</span>
            </div>
            <Progress value={explanationFactors[key as keyof typeof explanationFactors] * 100} className="h-2" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer w-full h-full">
            <GlobalMatchCard
              userId={userId}
              match_score={scorePercent}
              isMatched={false}
              onAccept={handleAccept}
              onReject={handleReject}
              onMessage={onMessage}
              hybridMatch={true}
              extraActions={
                <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-2">
                  View match details
                </Button>
              }
            />
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
            <DialogDescription>
              See why you matched with {profile.first_name || 'this user'}
            </DialogDescription>
          </DialogHeader>
          {renderScoreBars()}
        </DialogContent>
      </Dialog>
    </>
  );
}; 