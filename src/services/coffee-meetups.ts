import { supabase } from '@/integrations/supabase/client';
import { CoffeeMeetup, MeetupProposal, MeetupUpdate } from '@/types/coffee-meetup';

export const createMeetup = async (proposal: MeetupProposal): Promise<CoffeeMeetup> => {
  const { data, error } = await supabase
    .from('coffee_meetups')
    .insert([{
      sender_id: (await supabase.auth.getUser()).data.user?.id,
      receiver_id: proposal.receiver_id,
      match_id: proposal.match_id,
      date: proposal.date,
      location: proposal.location,
      message: proposal.message,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getMeetups = async (): Promise<CoffeeMeetup[]> => {
  const { data, error } = await supabase
    .from('coffee_meetups')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
};

export const getMeetupById = async (id: string): Promise<CoffeeMeetup> => {
  const { data, error } = await supabase
    .from('coffee_meetups')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateMeetup = async (id: string, update: MeetupUpdate): Promise<CoffeeMeetup> => {
  const { data, error } = await supabase
    .from('coffee_meetups')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMeetup = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('coffee_meetups')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getUpcomingMeetups = async (): Promise<CoffeeMeetup[]> => {
  const { data, error } = await supabase
    .from('coffee_meetups')
    .select('*')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
};

export const getPendingMeetups = async (): Promise<CoffeeMeetup[]> => {
  const { data, error } = await supabase
    .from('coffee_meetups')
    .select('*')
    .eq('status', 'pending')
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
}; 