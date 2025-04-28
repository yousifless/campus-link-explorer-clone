import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CoffeeMeetupCalendar } from '@/components/meetups/CoffeeMeetupCalendar';
import { MeetupProposalForm } from '@/components/meetups/MeetupProposalForm';
import { MeetupActions } from '@/components/meetups/MeetupActions';
import { getMeetups, getMeetupById } from '@/services/coffee-meetups';
import { CoffeeMeetup } from '@/types/coffee-meetup';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const MeetupPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [meetups, setMeetups] = useState<CoffeeMeetup[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [selectedMeetup, setSelectedMeetup] = useState<CoffeeMeetup | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMeetups();
  }, [matchId]);

  const loadMeetups = async () => {
    try {
      const data = await getMeetups();
      setMeetups(data.filter(meetup => meetup.match_id === matchId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load meetups",
        variant: "destructive",
      });
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowProposalForm(true);
  };

  const handleProposalSuccess = () => {
    setShowProposalForm(false);
    loadMeetups();
  };

  const handleMeetupUpdate = (updatedMeetup: CoffeeMeetup) => {
    setMeetups(prev => prev.map(meetup => 
      meetup.id === updatedMeetup.id ? updatedMeetup : meetup
    ));
    setSelectedMeetup(null);
  };

  const handleReschedule = () => {
    setShowProposalForm(true);
    setSelectedMeetup(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Coffee Meetups</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CoffeeMeetupCalendar
          onDateSelect={handleDateSelect}
          matchId={matchId!}
          receiverId={selectedMeetup?.receiver_id || ''}
        />

        <div className="space-y-6">
          {showProposalForm && selectedDate && (
            <Card className="p-4">
              <MeetupProposalForm
                matchId={matchId!}
                receiverId={selectedMeetup?.receiver_id || ''}
                selectedDate={selectedDate}
                onSuccess={handleProposalSuccess}
                onCancel={() => setShowProposalForm(false)}
              />
            </Card>
          )}

          {selectedMeetup && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Meetup Details</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Date:</span>{' '}
                    {format(new Date(selectedMeetup.date), 'MMMM d, yyyy')}
                  </p>
                  <p>
                    <span className="font-medium">Time:</span>{' '}
                    {format(new Date(selectedMeetup.date), 'h:mm a')}
                  </p>
                  <p>
                    <span className="font-medium">Location:</span>{' '}
                    {selectedMeetup.location}
                  </p>
                  {selectedMeetup.message && (
                    <p>
                      <span className="font-medium">Message:</span>{' '}
                      {selectedMeetup.message}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`px-2 py-1 rounded text-sm ${
                      selectedMeetup.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      selectedMeetup.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedMeetup.status === 'declined' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedMeetup.status}
                    </span>
                  </p>
                </div>

                <MeetupActions
                  meetup={selectedMeetup}
                  onUpdate={handleMeetupUpdate}
                  onReschedule={handleReschedule}
                />
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetupPage; 