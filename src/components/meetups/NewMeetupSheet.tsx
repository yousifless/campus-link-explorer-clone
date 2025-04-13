
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, MapPin } from 'lucide-react';

interface NewMeetupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

const SUGGESTED_LOCATIONS = [
  { name: 'Starbucks Shibuya', address: '1-23-45 Shibuya, Tokyo' },
  { name: 'Tully\'s Coffee Ikebukuro', address: '2-1-2 Ikebukuro, Tokyo' },
  { name: 'Doutor Shinjuku', address: '3-4-5 Shinjuku, Tokyo' },
  { name: 'Blue Bottle Coffee Nakameguro', address: '6-7-8 Nakameguro, Tokyo' }
];

const NewMeetupSheet: React.FC<NewMeetupSheetProps> = ({ open, onOpenChange }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('15:00');
  const [location, setLocation] = useState('');
  const [searchResults, setSearchResults] = useState(SUGGESTED_LOCATIONS);
  const [invitee, setInvitee] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const searchLocation = (query: string) => {
    // In a real app, this would search a database or use an API
    setLocation(query);
    setSearchResults(
      SUGGESTED_LOCATIONS.filter(loc => 
        loc.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time || !invitee) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields.",
      });
      return;
    }
    
    // In a real app, this would save to the database
    toast({
      title: "Meetup scheduled",
      description: `Your meetup invitation has been sent for ${format(date, 'MMMM d, yyyy')} at ${time}.`,
    });
    
    onOpenChange(false);
    
    // Reset form
    setDate(new Date());
    setTime('15:00');
    setLocation('');
    setInvitee('');
    setNotes('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Schedule a Coffee Meetup</SheetTitle>
          <SheetDescription>
            Send an invitation for a casual meetup with another student.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="invitee">Invite</Label>
            <Input 
              id="invitee" 
              placeholder="Search for a student..." 
              value={invitee}
              onChange={(e) => setInvitee(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger id="time">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {TIMES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="location" 
                placeholder="Search for a café..." 
                className="pl-9"
                value={location}
                onChange={(e) => searchLocation(e.target.value)}
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="border rounded-md mt-1 overflow-hidden">
                {searchResults.map((loc, index) => (
                  <div 
                    key={index}
                    className="flex p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                    onClick={() => {
                      setLocation(loc.name);
                      setSearchResults([]);
                    }}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">{loc.name}</div>
                      <div className="text-xs text-muted-foreground">{loc.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea 
              id="notes" 
              placeholder="Share what you'd like to discuss..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Send Invitation
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default NewMeetupSheet;
