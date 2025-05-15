import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MeetupStatus, MeetupUpdate, CoffeeMeetup } from '@/types/coffee-meetup';

interface MeetupProposal {
  match_id: string;
  receiver_id: string;
  date: string;
  location_name: string;
  location_address: string;
  location_lat?: number;
  location_lng?: number;
  message?: string;
}

export async function createMeetup(params: MeetupProposal) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      throw new Error("You must be logged in to create a meetup");
    }

    const { data, error } = await supabase
      .from('coffee_meetups')
      .insert({
        match_id: params.match_id,
        sender_id: user.id,
        receiver_id: params.receiver_id,
        date: params.date,
        location_name: params.location_name,
        location_address: params.location_address,
        location_lat: params.location_lat,
        location_lng: params.location_lng,
        status: 'pending',
        additional_notes: params.message
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating meetup:', error);
    toast.error('Failed to create meetup');
    throw error;
  }
}

export async function getMeetups() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      throw new Error("You must be logged in to view meetups");
    }

    const { data, error } = await supabase
      .from('coffee_meetups')
      .select('*, sender:profiles!coffee_meetups_sender_id_fkey(*), receiver:profiles!coffee_meetups_receiver_id_fkey(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching meetups:', error);
    toast.error('Failed to load meetups');
    throw error;
  }
}

export async function getMeetupById(meetupId: string): Promise<CoffeeMeetup> {
  try {
    const { data, error } = await supabase
      .from('coffee_meetups')
      .select('*, sender:profiles!coffee_meetups_sender_id_fkey(*), receiver:profiles!coffee_meetups_receiver_id_fkey(*)')
      .eq('id', meetupId)
      .single();

    if (error) throw error;
    return data as unknown as CoffeeMeetup;
  } catch (error) {
    console.error('Error fetching meetup details:', error);
    toast.error('Failed to load meetup details');
    throw error;
  }
}

export async function updateMeetup(meetupId: string, updates: MeetupUpdate) {
  try {
    const { data, error } = await supabase
      .from('coffee_meetups')
      .update(updates)
      .eq('id', meetupId)
      .select('*, sender:profiles!coffee_meetups_sender_id_fkey(*), receiver:profiles!coffee_meetups_receiver_id_fkey(*)')
      .single();

    if (error) throw error;
    toast.success(`Meetup ${updates.status} successfully`);
    return data;
  } catch (error) {
    console.error('Error updating meetup:', error);
    toast.error(`Failed to update meetup`);
    throw error;
  }
}

export async function acceptMeetup(meetupId: string) {
  try {
    const { error } = await supabase
      .from('coffee_meetups')
      .update({ status: 'confirmed' })
      .eq('id', meetupId);

    if (error) throw error;
    toast.success('Meetup accepted!');
  } catch (error) {
    console.error('Error accepting meetup:', error);
    toast.error('Failed to accept meetup');
    throw error;
  }
}

export async function declineMeetup(meetupId: string) {
  try {
    const { error } = await supabase
      .from('coffee_meetups')
      .update({ status: 'declined' })
      .eq('id', meetupId);

    if (error) throw error;
    toast.success('Meetup declined');
  } catch (error) {
    console.error('Error declining meetup:', error);
    toast.error('Failed to decline meetup');
    throw error;
  }
}
