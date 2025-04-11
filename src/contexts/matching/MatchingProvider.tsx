
import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { MatchingContextType } from './types';
import { useMatchOperations } from './useMatchOperations';

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

export const MatchingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { 
    matches, 
    suggestedMatches, 
    loading, 
    fetchMatches, 
    fetchSuggestedMatches, 
    acceptMatch, 
    rejectMatch, 
    createMatch 
  } = useMatchOperations(user?.id);

  useEffect(() => {
    if (user) {
      fetchMatches();
      fetchSuggestedMatches();
    }
  }, [user, fetchMatches, fetchSuggestedMatches]);

  const value = {
    matches,
    suggestedMatches,
    loading,
    fetchMatches,
    fetchSuggestedMatches,
    acceptMatch,
    rejectMatch,
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
