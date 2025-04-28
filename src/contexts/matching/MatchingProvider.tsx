import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { MatchingContextType } from './types';
import { useMatchOperations } from './useMatchOperations';

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

export const MatchingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { 
    matches,
    possibleMatches,
    myPendingMatches,
    theirPendingMatches,
    suggestedMatches, 
    loading, 
    fetchMatches, 
    fetchSuggestedMatches, 
    acceptMatch, 
    rejectMatch,
    updateMatchStatus,
    createMatch 
  } = useMatchOperations();
  
  const [isFetching, setIsFetching] = useState(false);
  const lastFetchTimeRef = useRef(0);
  const fetchCooldownMs = 5000; // 5 seconds cooldown
  
  // Function to safely fetch matches with cooldown
  const safeFetchMatches = (): Promise<void> => {
    return new Promise((resolve) => {
      const now = Date.now();
      
      // If we're already fetching, skip
      if (isFetching) {
        console.log('Fetch already in progress, skipping...');
        resolve();
        return;
      }
      
      // If we're in cooldown period, skip
      if (now - lastFetchTimeRef.current < fetchCooldownMs) {
        console.log('Fetch cooldown active, skipping...');
        resolve();
        return;
      }
      
      // Start fetching
      setIsFetching(true);
      lastFetchTimeRef.current = now;
      
      fetchMatches()
        .then(() => {
          setIsFetching(false);
          resolve();
        })
        .catch((error) => {
          console.error('Error fetching matches:', error);
          setIsFetching(false);
          resolve();
        });
    });
  };

  useEffect(() => {
    if (user) {
      safeFetchMatches();
      // Only fetch suggested matches if the function exists
      if (fetchSuggestedMatches) {
        fetchSuggestedMatches();
      }
    }
  }, [user, fetchMatches, fetchSuggestedMatches]);

  // Listen for refresh-matches event with cooldown
  useEffect(() => {
    const handleRefreshMatches = () => {
      console.log('Refresh matches event received');
      safeFetchMatches();
    };

    window.addEventListener('refresh-matches', handleRefreshMatches);
    
    return () => {
      window.removeEventListener('refresh-matches', handleRefreshMatches);
    };
  }, [fetchMatches]);

  const value = {
    matches,
    possibleMatches,
    myPendingMatches,
    theirPendingMatches,
    suggestedMatches,
    loading,
    fetchMatches: safeFetchMatches, // Use the safe version
    fetchSuggestedMatches,
    acceptMatch,
    rejectMatch,
    updateMatchStatus,
    createMatch,
  };

  return (
    <MatchingContext.Provider value={value}>
      {children}
    </MatchingContext.Provider>
  );
};

export const useMatching = () => {
  const context = useContext(MatchingContext);
  if (context === undefined) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
};
