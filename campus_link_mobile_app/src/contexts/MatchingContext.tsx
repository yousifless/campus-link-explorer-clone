import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Match } from '../types/database';
import { useAuth } from './AuthContext';

interface MatchingContextType {
  matches: Match[];
  fetchMatches: () => Promise<void>;
  acceptMatch: (matchId: string) => Promise<void>;
  rejectMatch: (matchId: string) => Promise<void>;
  loading: boolean;
}

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

export const MatchingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false });
    if (!error && data) setMatches(data as Match[]);
    setLoading(false);
  };

  const acceptMatch = async (matchId: string) => {
    await supabase.from('matches').update({ status: 'accepted' }).eq('id', matchId);
    fetchMatches();
  };

  const rejectMatch = async (matchId: string) => {
    await supabase.from('matches').update({ status: 'rejected' }).eq('id', matchId);
    fetchMatches();
  };

  useEffect(() => {
    fetchMatches();
  }, [user]);

  return (
    <MatchingContext.Provider value={{ matches, fetchMatches, acceptMatch, rejectMatch, loading }}>
      {children}
    </MatchingContext.Provider>
  );
};

export const useMatching = () => {
  const context = useContext(MatchingContext);
  if (!context) throw new Error('useMatching must be used within a MatchingProvider');
  return context;
}; 