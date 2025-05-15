import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ClubMeetup } from '@/types/meetings';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format, addMinutes } from 'date-fns';
import { isBefore, isSameDay, parseISO, setHours, setMinutes } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import { DatePicker } from '@/components/ui/date-picker';
import { DialogTrigger } from '@/components/ui/dialog';
import { downloadIcsFile, generateGoogleCalendarUrl } from '@/utils/calendarUtils';

// Icons
import {
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Calendar as CalendarBadgeIcon,
  Check,
  ChevronsUpDown,
  Timer,
  Plus,
  X,
  Info,
  CheckCircle2,
  AlertCircle,
  Map,
  Images,
  Loader2,
  Download,
} from 'lucide-react';

// Map Component
import { GoogleMap, Marker } from '@react-google-maps/api';

// Calendar Export
import { createEvent } from 'ics';

// Import the googleMapsLibraries from the provider
import { useGoogleMaps, googleMapsLibraries } from '@/providers/GoogleMapsProvider';

// Nearby Places Selector
import NearbyPlacesSelector from '@/components/shared/NearbyPlacesSelector';
import { PlaceResult } from '@/services/places-api';

// Duration Options
const durationOptions = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 300, label: '5 hours' },
  { value: 360, label: '6 hours' },
  { value: 480, label: '8 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: 'All day' },
];

// Color options
const colorOptions = [
  { value: '#4f46e5', label: 'Indigo' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f97316', label: 'Orange' },
];

// Form validation schema
const meetupFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }).max(100, {
    message: "Title must be less than 100 characters.",
  }),
  description: z.string().min(10, {
    message: "Please provide a description of at least 10 characters.",
  }).max(1000, {
    message: "Description must be less than 1000 characters.",
  }),
  date: z.date({
    required_error: "Please select a date for the meetup.",
  }),
  time: z.string({
    required_error: "Please select a start time.",
  }),
  end_time: z.string().optional(),
  duration_minutes: z.number().int().positive().optional(),
  location_name: z.string().min(2, {
    message: "Please provide a location name.",
  }),
  location_address: z.string().min(5, {
    message: "Please provide a complete address.",
  }),
  max_attendees: z.number().int().min(0),
  calendar_export: z.boolean().default(true),
  color: z.string().optional(),
});

type MeetupFormValues = z.infer<typeof meetupFormSchema>;

interface CreateClubMeetupFormProps {
  clubId: string;
  meetupToEdit?: ClubMeetup; // Optional: for editing existing meetup
  onSuccess?: () => void;
}

const CreateClubMeetupForm: React.FC<CreateClubMeetupFormProps> = ({
  clubId,
  meetupToEdit,
  onSuccess,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [meetupSummary, setMeetupSummary] = useState<MeetupFormValues | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  } | null>(null);
  const [useLocationSelector, setUseLocationSelector] = useState(false);
  
  // Google Maps integration
  const { isLoaded } = useGoogleMaps();
  
  // Form setup
  const form = useForm<MeetupFormValues>({
    resolver: zodResolver(meetupFormSchema),
    defaultValues: {
      title: meetupToEdit?.title || '',
      description: meetupToEdit?.description || '',
      date: meetupToEdit?.date ? new Date(meetupToEdit.date) : new Date(),
      time: meetupToEdit?.time || '12:00',
      end_time: meetupToEdit?.end_time || '',
      duration_minutes: meetupToEdit?.duration_minutes || 60,
      max_attendees: meetupToEdit?.max_attendees || 0,
      location_name: meetupToEdit?.location_name || '',
      location_address: meetupToEdit?.location_address || '',
      color: meetupToEdit?.color || '#4f46e5',
      calendar_export: true,
    },
  });
  
  // Initialize form with existing meetup data
  useEffect(() => {
    if (meetupToEdit) {
      // Set location if it exists
      if (meetupToEdit.location_lat && meetupToEdit.location_lng) {
        setSelectedLocation({
          lat: meetupToEdit.location_lat,
          lng: meetupToEdit.location_lng,
          name: meetupToEdit.location_name || '',
          address: meetupToEdit.location_address || '',
        });
      }
      
      // Set duration
      if (meetupToEdit.duration_minutes) {
        setSelectedDuration(meetupToEdit.duration_minutes);
      } else if (meetupToEdit.time && meetupToEdit.end_time) {
        // Calculate duration from start/end times
        const startTime = parseTime(meetupToEdit.time);
        const endTime = parseTime(meetupToEdit.end_time);
        if (startTime && endTime) {
          const durationInMinutes = (endTime.getHours() * 60 + endTime.getMinutes()) - 
                                   (startTime.getHours() * 60 + startTime.getMinutes());
          setSelectedDuration(durationInMinutes > 0 ? durationInMinutes : 60);
        }
      }
    }
  }, [meetupToEdit]);
  
  // Helper to parse time strings
  const parseTime = (timeStr: string): Date | null => {
    if (!timeStr) return null;
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };
  
  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationMins: number): string => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = addMinutes(startDate, durationMins);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Watch form values for dynamic updates
  const watchTime = form.watch('time');
  const watchDuration = form.watch('duration_minutes');
  
  // Update end time when start time or duration changes
  useEffect(() => {
    if (watchTime && watchDuration) {
      const endTime = calculateEndTime(watchTime, watchDuration);
      form.setValue('end_time', endTime);
    }
  }, [watchTime, watchDuration, form]);
  
  // Function to handle place selection from NearbyPlacesSelector
  const handleSelectPlace = (place: PlaceResult) => {
    form.setValue('location_name', place.name);
    form.setValue('location_address', place.address);
    
    // Update selected location for the map
    setSelectedLocation({
      lat: place.lat,
      lng: place.lng,
      name: place.name,
      address: place.address,
    });
  };
  
  // Handle form submission
  const onSubmit = async (values: MeetupFormValues) => {
    setIsLoading(true);
    
    try {
      const meetupData = {
        ...values,
        club_id: clubId,
        duration_minutes: selectedDuration,
        end_time: values.end_time || calculateEndTime(values.time, selectedDuration),
        // Include location coordinates if available
        location_lat: selectedLocation?.lat,
        location_lng: selectedLocation?.lng,
        created_by: user?.id
      };
      
      console.log('Submitting meetup data:', meetupData);
      
      if (meetupToEdit) {
        // Update existing meetup
        const { error } = await supabase
          .from('club_meetups')
          .update({
            title: values.title,
            description: values.description,
            date: values.date.toISOString().split('T')[0],
            time: values.time,
            end_time: values.end_time || calculateEndTime(values.time, selectedDuration),
            duration_minutes: selectedDuration,
            location_name: values.location_name,
            location_address: values.location_address,
            location_lat: selectedLocation?.lat,
            location_lng: selectedLocation?.lng,
            max_attendees: values.max_attendees || 0,
            color: values.color || '#4f46e5'
          })
          .eq('id', meetupToEdit.id);
        
        if (error) throw error;
        
        toast.success("Meetup updated successfully!");
      } else {
        // Create new meetup
        const { data, error } = await supabase
          .from('club_meetups')
          .insert({
            club_id: clubId,
            title: values.title,
            description: values.description,
            date: values.date.toISOString().split('T')[0],
            time: values.time,
            end_time: values.end_time || calculateEndTime(values.time, selectedDuration),
            duration_minutes: selectedDuration,
            location_name: values.location_name,
            location_address: values.location_address,
            location_lat: selectedLocation?.lat,
            location_lng: selectedLocation?.lng,
            max_attendees: values.max_attendees || 0,
            created_by: user?.id,
            color: values.color || '#4f46e5'
          })
          .select()
          .single();
        
        if (error) throw error;
        
        toast.success("Meetup created successfully!");
      }
      
      // Show confirmation dialog and calendar export options if selected
      if (values.calendar_export) {
        setMeetupSummary(values);
        setShowConfirmation(true);
      } else if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to club detail page
        navigate(`/clubs/${clubId}`);
      }
    } catch (error: any) {
      console.error('Error creating meetup:', error);
      toast.error(error.message || 'Failed to create meetup');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add functions to handle calendar actions
  const handleAddToGoogleCalendar = () => {
    if (!meetupSummary) return;
    
    const location = `${meetupSummary.location_name}${meetupSummary.location_address ? `, ${meetupSummary.location_address}` : ''}`;
    const googleUrl = generateGoogleCalendarUrl(
      meetupSummary.title,
      meetupSummary.description,
      location,
      meetupSummary.date.toISOString().split('T')[0],
      meetupSummary.time,
      meetupSummary.duration_minutes || 60
    );
    
    window.open(googleUrl, '_blank');
  };
  
  const handleDownloadIcs = async () => {
    if (!meetupSummary) return;
    
    try {
      const location = `${meetupSummary.location_name}${meetupSummary.location_address ? `, ${meetupSummary.location_address}` : ''}`;
      await downloadIcsFile(
        meetupSummary.title,
        meetupSummary.description,
        location,
        meetupSummary.date.toISOString().split('T')[0],
        meetupSummary.time,
        meetupSummary.duration_minutes || 60,
        `${meetupSummary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
      );
      
      toast.success('Calendar file downloaded');
    } catch (error) {
      console.error('Error downloading ICS file:', error);
      toast.error('Failed to download calendar file');
    }
  };
  
  // Navigation between form steps
  const nextStep = () => {
    if (step === 1) {
      // Validate first step fields before proceeding
      const result = form.trigger(['title', 'description', 'date', 'time']);
      if (!result) return;
    } else if (step === 2) {
      // Validate second step fields before proceeding
      const result = form.trigger(['location_name', 'location_address', 'max_attendees']);
      if (!result) return;
    }
    
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setStep(prev => prev - 1);
  };
  
  // Render functions for each step
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meetup Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter a title for your meetup" {...field} />
            </FormControl>
            <FormDescription>
              Choose a clear, descriptive title
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe what this meetup is about..." 
                className="min-h-[120px]" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Share details about activities, what to bring, etc.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <FormControl>
                <DatePicker
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </FormControl>
              <FormDescription>
                Select the date for your meetup
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <TimePicker value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>
                When will the meetup start?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="end_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time (Optional)</FormLabel>
              <FormControl>
                <TimePicker 
                  value={field.value || ''} 
                  onChange={field.onChange} 
                />
              </FormControl>
              <FormDescription>
                When will the meetup end?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color Tag (Optional)</FormLabel>
              <Select 
                value={field.value || "none"} 
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No color</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Optional color coding for the calendar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
  
  const renderLocationAndAttendeesStep = () => (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-1">
        <div className="rounded-lg border p-4 bg-muted/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium">Meeting Location</h3>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setUseLocationSelector(!useLocationSelector)}
            >
              {useLocationSelector ? "Manual Entry" : "Find on Map"}
            </Button>
          </div>
          
          {useLocationSelector ? (
            <div className="mb-4">
              <NearbyPlacesSelector 
                onSelectPlace={handleSelectPlace} 
                initialLocation={selectedLocation}
                showCafesOnly={false}
              />
              
              {selectedLocation && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-sm">Selected Location:</h4>
                  <p className="text-sm">{selectedLocation.name}</p>
                  <p className="text-xs text-gray-500">{selectedLocation.address}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <FormField
                control={form.control}
                name="location_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Central Library, Coffee Shop"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the name of the venue
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location_address"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Full address of the location"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The complete address for directions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
        
        <div>
          <FormField
            control={form.control}
            name="max_attendees"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Attendee Limit</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0 for unlimited"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of attendees (0 = unlimited)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="calendar_export"
            render={({ field }) => (
              <FormItem className="mt-4 flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="calendar_export"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="calendar_export" className="text-sm font-medium">
                      Show calendar export options after creating meetup
                    </Label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="rounded-lg border p-4 bg-muted/50">
          <h3 className="text-md font-medium mb-2">Location Preview</h3>
          {selectedLocation && isLoaded ? (
            <div className="h-[200px] rounded overflow-hidden">
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                zoom={15}
              >
                <Marker
                  position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                />
              </GoogleMap>
            </div>
          ) : (
            <div className="h-[200px] bg-muted rounded flex items-center justify-center text-muted-foreground">
              <MapPin className="h-6 w-6 mr-2" />
              <span>
                {form.watch('location_name') || 'Location name'}<br />
                {form.watch('location_address') || 'Address will appear here'}
              </span>
            </div>
          )}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-1">Attendance</h4>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>
                {form.watch('max_attendees') === 0 ? (
                  'Unlimited attendees'
                ) : (
                  `Maximum ${form.watch('max_attendees')} attendees`
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderReviewStep = () => {
    const values = form.getValues();
    
    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-bold">{values.title}</h3>
          
          <div className="flex items-center mt-4 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {values.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          
          <div className="flex items-center mt-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {values.time}
              {values.end_time && ` - ${values.end_time}`}
            </span>
          </div>
          
          <div className="flex items-center mt-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>
              {values.location_name}, {values.location_address}
            </span>
          </div>
          
          <div className="mt-4">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {values.description}
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            {values.color && (
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: values.color }}
              />
            )}
            <div className="text-sm text-muted-foreground">
              {values.max_attendees === 0 ? 'Unlimited attendees' : `Limited to ${values.max_attendees} attendees`}
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border p-4 bg-muted/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">Ready to publish?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Review the details above and click {meetupToEdit ? 'Update' : 'Create'} when you're ready to {meetupToEdit ? 'save changes' : 'publish this meetup'}.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {meetupToEdit ? 'Edit Meetup' : 'Create a New Meetup'}
              </CardTitle>
              <CardDescription>
                Schedule a meetup with your club members
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  {[1, 2, 3].map((stepNumber) => (
                    <div 
                      key={stepNumber} 
                      className={`flex items-center ${stepNumber < 3 ? 'flex-1' : ''}`}
                    >
                      <div 
                        className={`rounded-full h-8 w-8 flex items-center justify-center border ${
                          stepNumber === step 
                            ? 'bg-primary text-white border-primary' 
                            : stepNumber < step 
                              ? 'bg-primary/20 border-primary/30' 
                              : 'bg-gray-100 border-gray-300'
                        }`}
                      >
                        {stepNumber < step ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          stepNumber
                        )}
                      </div>
                      <div className={`text-sm ml-2 ${stepNumber === step ? 'font-medium' : 'text-muted-foreground'}`}>
                        {stepNumber === 1 && 'Basic Info'}
                        {stepNumber === 2 && 'Location & Attendees'}
                        {stepNumber === 3 && 'Review'}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="w-full bg-gray-200 h-1 rounded-full mt-2">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>
              
              {step === 1 && renderBasicInfoStep()}
              {step === 2 && renderLocationAndAttendeesStep()}
              {step === 3 && renderReviewStep()}
            </CardContent>

            <CardFooter className="flex justify-between">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                >
                  Previous Step
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel? Your changes will be lost.')) {
                      onSuccess?.();
                    }
                  }}
                >
                  Cancel
                </Button>
              )}
              
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                >
                  Next Step
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {meetupToEdit ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    meetupToEdit ? 'Update Meetup' : 'Create Meetup'
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </Form>
      
      {/* Confirmation dialog with calendar options */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              Meetup {meetupToEdit ? 'Updated' : 'Created'} Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your meetup has been {meetupToEdit ? 'updated' : 'created'}. You can add it to your calendar:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={handleAddToGoogleCalendar}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Add to Google Calendar
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={handleDownloadIcs}
            >
              <Download className="h-4 w-4 mr-2" />
              Download .ics Calendar File
            </Button>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setShowConfirmation(false);
                if (onSuccess) onSuccess();
              }}
            >
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreateClubMeetupForm; 