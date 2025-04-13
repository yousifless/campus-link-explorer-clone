
import React, { createContext, useContext, useEffect } from 'react';
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

  useEffect(() => {
    if (user) {
      fetchMatches();
      fetchSuggestedMatches && fetchSuggestedMatches();
    }
  }, [user, fetchMatches, fetchSuggestedMatches]);

  const value = {
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
