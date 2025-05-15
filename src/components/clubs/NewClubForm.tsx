import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// UI Components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X } from 'lucide-react';

// Validation schema using Zod
const clubFormSchema = z.object({
  name: z.string().min(3, {
    message: "Club name must be at least 3 characters.",
  }).max(50, {
    message: "Club name must be less than 50 characters.",
  }),
  description: z.string().min(10, {
    message: "Please provide a description of at least 10 characters.",
  }).max(500, {
    message: "Description must be less than 500 characters.",
  }),
  category: z.enum(['Academic', 'Sports', 'Culture', 'Tech', 'Volunteer', 'Other'], { message: 'Select a category/type.' }),
  tags: z.array(z.string()).min(1, { message: 'Add at least one tag.' }),
  cover_image: z.any().optional(), // File upload, validated in UI
  affiliation: z.string().max(100).optional(),
  location: z.string().min(2, { message: 'Enter a location.' }),
  region: z.enum(['Main Campus', 'East Campus', 'West Campus', 'North Campus', 'South Campus', 'Other'], { message: 'Select a region/campus.' }),
  preferred_days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
  preferred_time_range: z.string().max(30).optional(),
  admin_roles: z.array(z.string()).min(1, { message: 'At least one admin is required.' }),
  visibility: z.enum(['public', 'private']),
  course_code: z.string().optional(),
});

type ClubFormValues = z.infer<typeof clubFormSchema>;

const NewClubForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [region, setRegion] = useState('Main Campus');
  const [category, setCategory] = useState('Academic');
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [preferredTimeRange, setPreferredTimeRange] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [location, setLocation] = useState('');
  const [adminRoles, setAdminRoles] = useState<string[]>(user ? [user.id] : []);

  // Default form values
  const defaultValues: Partial<ClubFormValues> = {
    name: '',
    description: '',
    course_code: '',
    visibility: 'public',
    tags: [],
    category: 'Academic',
    cover_image: null,
    affiliation: '',
    location: '',
    region: 'Main Campus',
    preferred_days: [],
    preferred_time_range: '',
    admin_roles: user ? [user.id] : [],
  };

  // Initialize form
  const form = useForm<ClubFormValues>({
    resolver: zodResolver(clubFormSchema),
    defaultValues,
  });

  // Handle form submission
  const onSubmit = async (values: ClubFormValues) => {
    if (!user) {
      toast.error('You must be logged in to create a club');
      return;
    }

    setIsLoading(true);

    try {
      // Include tags from the state
      const formData = {
        name: values.name,
        description: values.description,
        course_code: values.course_code,
        visibility: values.visibility,
        tags,
        created_by: user.id,
        // Generate a random join code for private clubs
        join_code: values.visibility === 'private' ? generateJoinCode() : null,
        category: values.category,
        cover_image: values.cover_image,
        affiliation: values.affiliation,
        location: values.location,
        region: values.region,
        preferred_days: values.preferred_days,
        preferred_time_range: values.preferred_time_range,
        admin_roles: values.admin_roles,
      };

      const { data, error } = await supabase
        .from('clubs')
        .insert(formData)
        .select()
        .single();

      if (error) throw error;

      // Also add the creator as an admin
      await supabase
        .from('club_memberships')
        .insert({
          club_id: data.id,
          user_id: user.id,
          role: 'admin',
          joined_at: new Date().toISOString(),
        });

      toast.success('Club created successfully!');
      navigate(`/clubs/${data.id}`);
    } catch (error) {
      console.error('Error creating club:', error);
      toast.error('Failed to create club. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a random 6-character join code
  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Handle adding tags
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      
      // Don't add duplicate tags
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      
      setCurrentTag('');
    }
  };

  // Handle removing tags
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a New Club</CardTitle>
        <CardDescription>
          Set up your club's profile and connect with like-minded students
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Club Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your club name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Choose a clear, memorable name for your club
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Club Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell potential members what your club is about" 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Describe your club's purpose, activities, and goals
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Club Tags/Topics */}
            <div className="space-y-2">
              <FormLabel>Tags/Topics</FormLabel>
              <div className="flex">
                <Input
                  placeholder="Enter tags and press Enter"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2"
                  onClick={() => {
                    if (currentTag.trim()) {
                      if (!tags.includes(currentTag.trim())) {
                        setTags([...tags, currentTag.trim()]);
                      }
                      setCurrentTag('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <FormDescription>
                Add relevant tags to help students find your club (e.g., 'coding', 'language exchange', 'fitness')
              </FormDescription>

              {/* Display added tags */}
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Category/Type */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category/Type</FormLabel>
                  <Select value={category} onValueChange={(val) => { setCategory(val); field.onChange(val); }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category/type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Culture">Culture</SelectItem>
                      <SelectItem value="Tech">Tech</SelectItem>
                      <SelectItem value="Volunteer">Volunteer</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose the main focus of your club</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image Upload */}
            <div>
              <FormLabel>Cover Image</FormLabel>
              <Input type="file" accept="image/png, image/jpeg" onChange={e => setCoverImage(e.target.files?.[0] || null)} />
              <FormDescription>Upload a club banner (PNG/JPG, max 2MB)</FormDescription>
              {coverImage && <span className="text-xs text-green-600">{coverImage.name}</span>}
            </div>

            {/* Affiliation */}
            <div>
              <FormLabel>Affiliated University Department (optional)</FormLabel>
              <Input value={affiliation} onChange={e => setAffiliation(e.target.value)} placeholder="e.g. Engineering Faculty" />
              <FormDescription>For university partnership or department clubs</FormDescription>
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Room/building name or address" {...field} />
                  </FormControl>
                  <FormDescription>Where does your club usually meet?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Region/Campus */}
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region/Campus</FormLabel>
                  <Select value={region} onValueChange={(val) => { setRegion(val); field.onChange(val); }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region/campus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Main Campus">Main Campus</SelectItem>
                      <SelectItem value="East Campus">East Campus</SelectItem>
                      <SelectItem value="West Campus">West Campus</SelectItem>
                      <SelectItem value="North Campus">North Campus</SelectItem>
                      <SelectItem value="South Campus">South Campus</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose your club's main campus or region</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Meetup Days */}
            <div>
              <FormLabel>Preferred Meetup Days</FormLabel>
              <div className="flex flex-wrap gap-2">
                {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => (
                  <Button key={day} type="button" size="sm" variant={preferredDays.includes(day) ? "default" : "outline"} onClick={() => setPreferredDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}>{day}</Button>
                ))}
              </div>
              <FormDescription>Which days does your club usually meet?</FormDescription>
            </div>

            {/* Preferred Time Range */}
            <div>
              <FormLabel>Preferred Time Range</FormLabel>
              <Input value={preferredTimeRange} onChange={e => setPreferredTimeRange(e.target.value)} placeholder="e.g. 18:00–20:00" />
              <FormDescription>Suggest a default time for meetups</FormDescription>
            </div>

            {/* Admin Roles */}
            <div>
              <FormLabel>Club Admins</FormLabel>
              <Input value={user?.email || ''} disabled className="mb-2" />
              <FormDescription>You will be added as the first admin. Add more later in club settings.</FormDescription>
            </div>

            {/* Affiliated Course */}
            <FormField
              control={form.control}
              name="course_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., CS101, ECON202" {...field} />
                  </FormControl>
                  <FormDescription>
                    If this club is related to a specific course, enter the course code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Club Visibility */}
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select club visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public (Anyone can join)</SelectItem>
                      <SelectItem value="private">Private (Requires join code)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {form.watch('visibility') === 'private' 
                      ? "Private clubs require a join code that you can share with approved members"
                      : "Public clubs are visible to everyone and anyone can join"
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/clubs')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Club'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default NewClubForm; 