import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, Search, User, MessageSquare, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleMap, LoadScript, Autocomplete, Marker } from '@react-google-maps/api';
import { createMeetup, CreateMeetupParams } from '@/utils/meetups';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MapLocationPicker from './MapLocationPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CoffeeMeetup } from '@/types/coffee-meetup';

interface Location {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface NewMeetupSheetProps {
  matchId: string;
  selectedUser: {
    id: string;
    first_name: string;
    last_name: string;
  };
  onClose: () => void;
  isOpen: boolean;
  onSuccess?: (meetup: CoffeeMeetup) => Promise<void>;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  user1: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  user2: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface MatchedUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

const libraries: ("places")[] = ["places"];

const conversationStarters = [
  "What's your favorite study spot on campus?",
  "What inspired you to choose your major?",
  "What's the most interesting class you've taken?",
  "What's your go-to coffee order?",
  "What's your favorite way to unwind after classes?",
  "What's the best book you've read recently?",
  "What's your favorite campus event?",
  "What's your dream travel destination?",
  "What's your favorite local restaurant?",
  "What's your favorite hobby outside of school?",
];

const steps = [
  { id: 'date', title: 'Date & Time' },
  { id: 'location', title: 'Location' },
  { id: 'user', title: 'Who to Meet' },
  { id: 'topics', title: 'Conversation Starters' },
];

const NewMeetupSheet = ({ matchId, selectedUser, onClose, isOpen, onSuccess }: NewMeetupSheetProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedStarter, setSelectedStarter] = useState<string>('');

  useEffect(() => {
    const loadMatchedUsers = async () => {
      if (!user) return;
      
      try {
        // Get all accepted matches for the current user
        const { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('status', 'accepted');

        if (matchesError) throw matchesError;

        // Get the IDs of matched users
        const matchedUserIds = (matches || []).map(match => 
          match.user1_id === user.id ? match.user2_id : match.user1_id
        );

        if (matchedUserIds.length === 0) {
          setMatchedUsers([]);
          return;
        }

        // Get the profiles of matched users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', matchedUserIds);

        if (profilesError) throw profilesError;

        setMatchedUsers((profiles || []) as MatchedUser[]);
      } catch (error) {
        console.error('Error loading matched users:', error);
        toast.error('Failed to load matched users');
      }
    };

    loadMatchedUsers();
  }, [user]);

  const handlePlaceSelect = (location: Location) => {
    setLocation(location);
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to schedule a meetup');
      return;
    }

    // Validate required fields
    if (!date || !time || !location || !selectedUser.id || !matchId) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if Supabase is properly initialized
    if (!supabase) {
      toast.error('Error: Application not properly initialized. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);
    try {
      const meetupDate = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      meetupDate.setHours(hours, minutes);

      // Insert the meetup
      const { data: meetup, error: meetupError } = await supabase
        .from('coffee_meetups')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          receiver_id: selectedUser.id,
          date: meetupDate.toISOString(),
          location_name: location.name,
          location_address: location.address,
          location_lat: location.lat,
          location_lng: location.lng,
          conversation_starter: selectedStarter,
          additional_notes: notes,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*, sender:profiles!coffee_meetups_sender_id_fkey(*), receiver:profiles!coffee_meetups_receiver_id_fkey(*)')
        .single();

      if (meetupError) throw meetupError;

      // Call onSuccess if provided
      if (onSuccess && meetup) {
        await onSuccess(meetup as CoffeeMeetup);
      }

      toast.success('Meetup scheduled successfully!');
      onClose();
    } catch (error) {
      console.error('Error scheduling meetup:', error);
      toast.error('Failed to schedule meetup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!matchId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            <span>Schedule a Coffee Meetup</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Progress value={(currentStep + 1) * 25} className="h-2" />
          <div className="mt-4 flex justify-between text-sm text-muted-foreground">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-2",
                  index <= currentStep && "text-primary"
                )}
              >
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full",
                  index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {index + 1}
                </div>
                <span>{step.title}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {date && time && (
                      <div className="rounded-lg bg-muted p-4 text-sm">
                        <p className="font-medium">Meetup Preview:</p>
                        <p>{format(date, "EEEE, MMMM d")} • {time}</p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <MapLocationPicker
                        onLocationSelect={handlePlaceSelect}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Meeting with</label>
                      <div className="flex items-center gap-3 rounded-lg border p-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                          <p className="text-sm text-muted-foreground">Matched User</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Conversation Starters</label>
                      <div className="grid grid-cols-2 gap-2">
                        {conversationStarters.map((starter, index) => (
                          <Button
                            key={index}
                            variant={selectedStarter === starter ? "default" : "outline"}
                            className="h-auto py-2 text-left"
                            onClick={() => setSelectedStarter(starter)}
                          >
                            {starter}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Additional Notes</label>
                      <Textarea
                        placeholder="Add any additional notes or questions..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!date || !time || !location || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Scheduling...
                    </>
                  ) : (
                    'Schedule Meetup'
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMeetupSheet;
