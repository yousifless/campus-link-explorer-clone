import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { CoffeeMeetup, CoffeeMeetupLocation } from './matching/types';

interface MeetupsContextType {
  meetups: CoffeeMeetup[];
  fetchMeetups: () => Promise<void>;
  acceptMeetup: (meetupId: string) => Promise<void>;
  declineMeetup: (meetupId: string) => Promise<void>;
  fetchMeetupById: (meetupId: string) => Promise<CoffeeMeetup | null>;
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
      
    if (!error && data) {
      // Transform the data to match CoffeeMeetup type
      const transformedMeetups: CoffeeMeetup[] = data.map(meetup => ({
        id: meetup.id,
        match_id: meetup.match_id,
        sender_id: meetup.sender_id,
        receiver_id: meetup.receiver_id,
        date: meetup.date,
        status: meetup.status as 'pending' | 'confirmed' | 'declined' | 'cancelled',
        created_at: meetup.created_at,
        updated_at: meetup.updated_at,
        conversation_starter: meetup.conversation_starter,
        additional_notes: meetup.additional_notes,
        // Add the location object that combines the separate properties
        location: {
          name: meetup.location_name,
          address: meetup.location_address,
          lat: meetup.location_lat,
          lng: meetup.location_lng
        },
        // Keep original properties for backward compatibility
        location_name: meetup.location_name,
        location_address: meetup.location_address,
        location_lat: meetup.location_lat,
        location_lng: meetup.location_lng
      }));
      setMeetups(transformedMeetups);
    }
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

  const fetchMeetupById = async (meetupId: string): Promise<CoffeeMeetup | null> => {
    const { data, error } = await supabase
      .from('coffee_meetups')
      .select('*')
      .eq('id', meetupId)
      .single();
      
    if (!error && data) {
      return {
        id: data.id,
        match_id: data.match_id,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        date: data.date,
        status: data.status as 'pending' | 'confirmed' | 'declined' | 'cancelled',
        created_at: data.created_at,
        updated_at: data.updated_at,
        conversation_starter: data.conversation_starter,
        additional_notes: data.additional_notes,
        location: {
          name: data.location_name,
          address: data.location_address,
          lat: data.location_lat,
          lng: data.location_lng
        },
        // Keep original properties for backward compatibility
        location_name: data.location_name,
        location_address: data.location_address,
        location_lat: data.location_lat,
        location_lng: data.location_lng
      };
    }
    return null;
  };

  useEffect(() => {
    fetchMeetups();
  }, [user]);

  return (
    <MeetupsContext.Provider value={{ meetups, fetchMeetups, acceptMeetup, declineMeetup, fetchMeetupById, loading }}>
      {children}
    </MeetupsContext.Provider>
  );
};

export const useMeetups = () => {
  const context = useContext(MeetupsContext);
  if (!context) throw new Error('useMeetups must be used within a MeetupsProvider');
  return context;
};
