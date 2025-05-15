import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types/database';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profile: UserProfile | null;
  fetchProfile: () => Promise<void>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error && data) setProfile(data as UserProfile);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return (
    <ProfileContext.Provider value={{ profile, fetchProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
}; 