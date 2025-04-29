
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MeetupProposal {
  match_id: string;
  receiver_id: string;
  date: string;
  location_name: string;
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
