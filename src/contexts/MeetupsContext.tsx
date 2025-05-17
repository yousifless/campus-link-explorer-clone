
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CoffeeMeetup } from './matching/types';
import { useAuth } from './AuthContext';
import { transformMeetupData } from '../utils/meetupTransformers';

interface MeetupsContextType {
  meetups: CoffeeMeetup[];
  loading: boolean;
  fetchMeetups: () => Promise<void>;
  sendMeetupProposal: (meetup: Partial<CoffeeMeetup>) => Promise<CoffeeMeetup | null>;
  updateMeetupStatus: (meetupId: string, status: string) => Promise<boolean>;
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
      .select('*, sender:sender_id(id, first_name, last_name, avatar_url), receiver:receiver_id(id, first_name, last_name, avatar_url)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('date', { ascending: false });
    
    if (!error && data) {
      // Transform the raw data into CoffeeMeetup type with proper location object
      const transformedMeetups = data.map(meetup => transformMeetupData(meetup));
      setMeetups(transformedMeetups);
    }
    
    setLoading(false);
  };

  // Add a new coffee meetup proposal
  const sendMeetupProposal = async (meetup: Partial<CoffeeMeetup>): Promise<CoffeeMeetup | null> => {
    if (!user) return null;
    
    // Prepare the meetup data for DB insertion
    const { data, error } = await supabase
      .from('coffee_meetups')
      .insert({
        match_id: meetup.match_id,
        sender_id: user.id,
        receiver_id: meetup.receiver_id,
        date: meetup.date,
        location_name: meetup.location?.name || meetup.location_name,
        location_address: meetup.location?.address || meetup.location_address,
        location_lat: meetup.location?.lat || meetup.location_lat,
        location_lng: meetup.location?.lng || meetup.location_lng,
        conversation_starter: meetup.conversation_starter,
        additional_notes: meetup.additional_notes,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error sending meetup proposal:", error);
      return null;
    }
    
    // Transform and return the new meetup
    return transformMeetupData(data);
  };

  // Update a meetup status (confirm, decline, etc)
  const updateMeetupStatus = async (meetupId: string, status: string): Promise<boolean> => {
    const { error } = await supabase
      .from('coffee_meetups')
      .update({ status })
      .eq('id', meetupId);
    
    if (error) {
      console.error("Error updating meetup status:", error);
      return false;
    }
    
    // Update local state
    setMeetups(prevMeetups => 
      prevMeetups.map(meetup => 
        meetup.id === meetupId ? { ...meetup, status } : meetup
      )
    );
    
    return true;
  };

  useEffect(() => {
    if (user) {
      fetchMeetups();
    }
  }, [user]);

  return (
    <MeetupsContext.Provider value={{ 
      meetups, 
      loading, 
      fetchMeetups, 
      sendMeetupProposal,
      updateMeetupStatus
    }}>
      {children}
    </MeetupsContext.Provider>
  );
};

export const useMeetups = () => {
  const context = useContext(MeetupsContext);
  if (!context) throw new Error('useMeetups must be used within a MeetupsProvider');
  return context;
};
