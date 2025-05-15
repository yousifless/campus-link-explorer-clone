import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CoffeeMeetup } from '@/types/meetings';
import { useAuth } from './AuthContext';

interface MeetupsContextType {
  meetups: CoffeeMeetup[];
  fetchMeetups: () => Promise<void>;
  acceptMeetup: (meetupId: string) => Promise<void>;
  declineMeetup: (meetupId: string) => Promise<void>;
  loading: boolean;
}

const MeetupsContext = createContext<MeetupsContextType | undefined>(undefined);

export const MeetupsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [meetups, setMeetups] = useState<CoffeeMeetup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMeetups = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('coffee_meetups')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('date', { ascending: false });
    if (!error && data) setMeetups(data as CoffeeMeetup[]);
    setLoading(false);
  };

  const acceptMeetup = async (meetupId: string) => {
    await supabase.from('coffee_meetups').update({ status: 'confirmed' }).eq('id', meetupId);
    fetchMeetups();
  };

  const declineMeetup = async (meetupId: string) => {
    await supabase.from('coffee_meetups').update({ status: 'cancelled' }).eq('id', meetupId);
    fetchMeetups();
  };

  useEffect(() => {
    fetchMeetups();
  }, [user]);

  return (
    <MeetupsContext.Provider value={{ meetups, fetchMeetups, acceptMeetup, declineMeetup, loading }}>
      {children}
    </MeetupsContext.Provider>
  );
};

export const useMeetups = () => {
  const context = useContext(MeetupsContext);
  if (!context) throw new Error('useMeetups must be used within a MeetupsProvider');
  return context;
};
