import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, Search, User, MessageSquare, Coffee, ChevronLeft, ChevronRight, Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleMap, Autocomplete, Marker } from '@react-google-maps/api';
import { useGoogleMaps, googleMapsLibraries } from '@/providers/GoogleMapsProvider';
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
import { useIcebreakers } from '@/hooks/use-icebreakers';
import { profileToIcebreakerUser, IcebreakerResponse } from '@/utils/icebreaker/icebreaker-service';
import { Card, CardContent } from '@/components/ui/card';
import NearbyPlacesSelector from '@/components/shared/NearbyPlacesSelector';

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
    avatar_url?: string;
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

const steps = [
  { id: 'date', title: 'Date & Time' },
  { id: 'location', title: 'Location' },
  { id: 'user', title: 'Who to Meet' },
  { id: 'icebreakers', title: 'Icebreakers' },
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
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [generatedIcebreakers, setGeneratedIcebreakers] = useState<IcebreakerResponse | null>(null);
  const [isGeneratingIcebreakers, setIsGeneratingIcebreakers] = useState(false);

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

  useEffect(() => {
    const loadOtherUserProfile = async () => {
      if (!selectedUser?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, university:universities(*), campus:campuses(*)')
          .eq('id', selectedUser.id)
          .single();
          
        if (error) throw error;
        setOtherUserProfile(data);
      } catch (error) {
        console.error('Error loading other user profile:', error);
      }
    };
    
    loadOtherUserProfile();
  }, [selectedUser]);

  // Fix the type mismatch between Location and PlaceResult
  const handlePlaceSelected = (place: PlaceResult) => {
    if (place.geometry?.location) {
      const location = {
        placeId: place.place_id || '',
        name: place.name || '',
        address: place.formatted_address || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      
      setLocation(location);
    }
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

      // Format conversation starter from icebreakers if available
      const icebreakersText = generatedIcebreakers ? 
        `Conversation Starters:
${generatedIcebreakers.conversationStarters.join('\n')}

Activity Idea: 
${generatedIcebreakers.activity}

Shared Topic: 
${generatedIcebreakers.sharedTopic}` : '';

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
          conversation_starter: icebreakersText,
          additional_notes: notes,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*, sender:profiles!coffee_meetups_sender_id_fkey(*), receiver:profiles!coffee_meetups_receiver_id_fkey(*)')
        .single();

      if (meetupError) throw meetupError;

      // Call onSuccess if provided and convert the type properly
      if (onSuccess && meetup) {
        // Type cast to unknown first, then to CoffeeMeetup to fix the type error
        await onSuccess(meetup as unknown as CoffeeMeetup);
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

  // Function to generate icebreakers
  const generateIcebreakers = async () => {
    if (!user || !otherUserProfile) {
      toast.error('Cannot generate icebreakers: missing user information');
      return;
    }
    
    setIsGeneratingIcebreakers(true);
    try {
      // Get current user profile
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*, university:universities(*), campus:campuses(*)')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Prepare user data for icebreaker generation
      const userA = profileToIcebreakerUser(currentUserProfile);
      const userB = profileToIcebreakerUser(otherUserProfile);
      
      // Format meetup details
      const meetupDate = date ? format(date, 'PPP') : 'Upcoming';
      const meetupLocation = location?.name || 'Campus café';
      
      // Call the generateIcebreakers function
      const icebreakers = await import('@/utils/icebreaker/icebreaker-service')
        .then(module => module.generateIcebreakers(userA, userB, meetupDate, meetupLocation));
      
      setGeneratedIcebreakers(icebreakers);
    } catch (error) {
      console.error('Error generating icebreakers:', error);
      toast.error('Failed to generate icebreakers. Please try again.');
    } finally {
      setIsGeneratingIcebreakers(false);
    }
  };

  useEffect(() => {
    // Generate icebreakers when reaching the final step
    if (currentStep === 3 && !generatedIcebreakers && !isGeneratingIcebreakers) {
      generateIcebreakers();
    }
  }, [currentStep, generatedIcebreakers, isGeneratingIcebreakers]);

  if (!matchId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Coffee className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Schedule a Coffee Meetup</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Progress value={(currentStep + 1) * 25} className="h-2 bg-blue-100 dark:bg-blue-900" />
          <div className="mt-6 flex justify-between text-sm">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`flex flex-col items-center gap-1 ${
                  index <= currentStep ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  index <= currentStep 
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                }`}>
                  {index + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.title}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[300px]"
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
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
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
                      <NearbyPlacesSelector
                        onSelectPlace={handlePlaceSelected}
                        initialLocation={location}
                        showCafesOnly={false}
                      />
                      {location && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <h4 className="font-medium text-sm">Selected Location:</h4>
                          <p className="text-sm">{location.name}</p>
                          <p className="text-xs text-gray-500">{location.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Meeting with</label>
                      <div className="flex items-center gap-3 p-3 border rounded-md bg-white dark:bg-gray-800">
                        <Avatar>
                          <AvatarImage src={selectedUser?.avatar_url || ''} alt={selectedUser?.first_name} />
                          <AvatarFallback>{selectedUser?.first_name?.[0]}{selectedUser?.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedUser?.first_name} {selectedUser?.last_name}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h3 className="font-medium text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        <span>Personalized Icebreakers</span>
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        We've generated some conversation starters based on your shared interests and backgrounds.
                        These will be shared with {selectedUser?.first_name} when they receive your invitation.
                      </p>
                    </div>
                    
                    {isGeneratingIcebreakers ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                        <p className="text-sm text-muted-foreground mt-4">
                          Generating personalized icebreakers...
                        </p>
                      </div>
                    ) : generatedIcebreakers ? (
                      <Card className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium">Conversation Starters:</h4>
                              <ul className="space-y-2 mt-2">
                                {generatedIcebreakers.conversationStarters.map((starter, index) => (
                                  <li key={index} className="text-sm bg-white dark:bg-gray-800 p-2 rounded-md">
                                    {starter}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium">Activity Idea:</h4>
                              <p className="text-sm bg-white dark:bg-gray-800 p-2 rounded-md mt-2">
                                {generatedIcebreakers.activity}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium">Shared Topic:</h4>
                              <p className="text-sm bg-white dark:bg-gray-800 p-2 rounded-md mt-2">
                                {generatedIcebreakers.sharedTopic}
                              </p>
                            </div>
                            
                            <div className="pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={generateIcebreakers}
                                className="w-full"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Regenerate Icebreakers
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Failed to generate icebreakers</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={generateIcebreakers}
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!date || !time || !location || isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      Schedule Meetup
                      <Coffee className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
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
