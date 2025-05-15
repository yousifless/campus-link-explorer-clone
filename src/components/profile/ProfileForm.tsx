import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
  UserCircle, 
  Check,
  X,
  Camera,
  HelpCircle,
  Star,
  StarHalf,
  Plus
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { ProfileType } from '@/types/database';
import InterestSelector from '@/components/interests/InterestSelector';
import SelectedInterests from '@/components/interests/SelectedInterests';
import { uploadAvatar } from '@/utils/storage';

// Types for the dropdown data
type University = {
  id: string;
  name: string;
  location: string;
  type: string;
};

type Campus = {
  id: string;
  university_id: string;
  name: string;
  address: string;
};

type Major = {
  id: string;
  name: string;
  field_of_study: string;
};

type Language = {
  id: string;
  name: string;
  code: string;
};

type Interest = {
  id: string;
  name: string;
  category: string;
};

type UserLanguage = {
  language_id: string;
  proficiency: string;
};

// Define the proficiency levels with star ratings
const proficiencyLevels = [
  { value: 'beginner', label: 'Beginner', stars: 1 },
  { value: 'intermediate', label: 'Intermediate', stars: 2 },
  { value: 'advanced', label: 'Advanced', stars: 3 },
  { value: 'native', label: 'Native', stars: 4 },
];

// Form schema using Zod
const formSchema = z.object({
  nickname: z.string().optional(),
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  bio: z.string().max(500, { message: 'Bio must not exceed 500 characters' }).optional(),
  nationality: z.string().optional(),
  year_of_study: z.string().optional(),
  university: z.string().optional(),
  campus: z.string().optional(),
  major: z.string().optional(),
  student_type: z.string().optional(),
  cultural_insight: z.string().max(300, { message: 'Cultural insight must not exceed 300 characters' }).optional(),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// The main profile form component
interface ProfileFormProps {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ isEditing, setIsEditing }) => {
  const { profile, updateProfile, loading, fetchProfile } = useProfile();
  const [universities, setUniversities] = useState<University[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<UserLanguage[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [universitySearch, setUniversitySearch] = useState('');
  const [majorSearch, setMajorSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [openMajor, setOpenMajor] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [languageProficiency, setLanguageProficiency] = useState<number[]>([1]);
  const [bioPrompts, setBioPrompts] = useState<string[]>([
    "What are your hobbies?",
    "What are you studying and why?",
    "What's your favorite place in Japan?",
    "What's a cultural experience you'd like to share?",
    "What kind of friends are you looking for?"
  ]);
  const [selectedBioPrompt, setSelectedBioPrompt] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: '',
      first_name: '',
      last_name: '',
      bio: '',
      nationality: '',
      year_of_study: '',
      university: '',
      campus: '',
      major: '',
      student_type: '',
      cultural_insight: '',
      location: '',
    },
  });

  // Fetch all necessary data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const { data: univData, error: univError } = await supabase
          .from('universities')
          .select('*')
          .order('name');
        
        if (univError) throw univError;
        setUniversities(univData as University[]);

        const { data: majorsData, error: majorsError } = await supabase
          .from('majors')
          .select('*')
          .order('name');
        
        if (majorsError) throw majorsError;
        setMajors(majorsData as Major[]);

        const { data: languagesData, error: languagesError } = await supabase
          .from('languages')
          .select('*')
          .order('name');
        
        if (languagesError) throw languagesError;
        setLanguages(languagesData as Language[]);

        const { data: interestsData, error: interestsError } = await supabase
          .from('interests')
          .select('*')
          .order('name');
        
        if (interestsError) throw interestsError;
        setInterests(interestsData as Interest[]);
        setUniversitySearch('');
        setMajorSearch('');
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Update form values when profile data is available
  useEffect(() => {
    if (profile) {
      form.reset({
        nickname: profile.nickname || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        nationality: profile.nationality || '',
        year_of_study: profile.year_of_study?.toString() || '',
        university: profile.university_id || '',
        campus: profile.campus_id || '',
        major: profile.major_id || '',
        student_type: profile.student_type || '',
        cultural_insight: profile.cultural_insight || '',
        location: profile.location || '',
      });

      if (profile.campus_id) {
        supabase
          .from('campuses')
          .select('university_id')
          .eq('id', profile.campus_id)
          .single()
          .then(({ data, error }) => {
            if (!error && data && data.university_id) {
              setSelectedUniversityId(data.university_id);
              
              supabase
                .from('campuses')
                .select('*')
                .eq('university_id', data.university_id)
                .then(({ data: campusesData }) => {
                  if (campusesData) {
                    setCampuses(campusesData as Campus[]);
                  }
                });
            }
          });
      }

      // Fetch user's languages
      supabase
        .from('user_languages')
        .select('language_id, proficiency')
        .eq('user_id', profile.id)
        .then(({ data }) => {
          if (data) {
            setSelectedLanguages(data as UserLanguage[]);
          }
        });

      // Fetch user's interests
      supabase
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', profile.id)
        .then(({ data }) => {
          if (data) {
            setSelectedInterests(data.map(i => i.interest_id));
          }
        });
    }
  }, [profile, form]);

  // Fetch campuses when university changes
  useEffect(() => {
    if (!selectedUniversityId) {
      setCampuses([]);
      return;
    }

    const fetchCampuses = async () => {
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .eq('university_id', selectedUniversityId)
        .order('name');
      
      if (error) {
        console.error('Error fetching campuses:', error);
        return;
      }
      
      setCampuses(data as Campus[]);
    };

    fetchCampuses();
  }, [selectedUniversityId]);

  // Handle university selection
  const onUniversityChange = (value: string) => {
    setSelectedUniversityId(value);
    form.setValue('university', value);
    form.setValue('campus', '');
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      
      // Upload the avatar using our utility function
      const avatarUrl = await uploadAvatar(file);
      
      // Update the profile with the new avatar URL
      if (profile?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', profile.id);
          
        if (error) throw error;
        
        // Refresh the profile to get the updated avatar
        await fetchProfile();
      }

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Language proficiency methods
  const handleAddLanguage = async () => {
    if (!selectedLanguage) return;
    
    // Map slider value to proficiency level
    const proficiencyIndex = Math.min(Math.max(Math.floor(languageProficiency[0]) - 1, 0), 3);
    const proficiencyValue = proficiencyLevels[proficiencyIndex].value;
    
    if (selectedLanguages.some(l => l.language_id === selectedLanguage)) {
      setSelectedLanguages(
        selectedLanguages.map(l => 
          l.language_id === selectedLanguage ? { ...l, proficiency: proficiencyValue } : l
        )
      );
    } else {
      setSelectedLanguages([
        ...selectedLanguages,
        { language_id: selectedLanguage, proficiency: proficiencyValue }
      ]);
    }
    
    // Reset selection
    setSelectedLanguage('');
    setLanguageProficiency([1]);
  };

  const handleRemoveLanguage = (languageId: string) => {
    setSelectedLanguages(selectedLanguages.filter(l => l.language_id !== languageId));
  };

  // Interest tag methods
  const handleInterestToggle = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      setSelectedInterests([...selectedInterests, interestId]);
    }
  };

  // Bio prompt selection
  const handleBioPromptSelect = (prompt: string) => {
    const currentBio = form.getValues('bio') || '';
    form.setValue('bio', currentBio ? `${currentBio}\n\n${prompt}` : prompt);
    setSelectedBioPrompt('');
  };

  // Form submission
  const handleSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      
      if (!profile?.id) {
        throw new Error("User profile not found. Please try again later.");
      }

      // Prepare the updates
      const updates: Partial<ProfileType> = {
        year_of_study: data.year_of_study ? parseInt(data.year_of_study) : null,
        student_type: data.student_type as 'international' | 'local' | null,
        nickname: data.nickname,
        first_name: data.first_name,
        last_name: data.last_name,
        bio: data.bio,
        nationality: data.nationality,
        cultural_insight: data.cultural_insight,
        location: data.location,
        university_id: data.university,
        campus_id: data.campus,
        major_id: data.major,
        interests: selectedInterests,
        languages: selectedLanguages.map(l => ({ id: l.language_id, proficiency: l.proficiency })),
      };

      // Update the profile
      await updateProfile(updates);

      // Refresh the profile to get the updated data
      await fetchProfile();

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter functions for searchable dropdowns
  const filteredUniversities = universitySearch 
    ? universities.filter(uni => 
        uni.name.toLowerCase().includes(universitySearch.toLowerCase())
      )
    : universities;

  const filteredMajors = majorSearch
    ? majors.filter(major => 
        major.name.toLowerCase().includes(majorSearch.toLowerCase())
      )
    : majors;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-primary/20 transition-all hover:border-primary/40">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">
                  <UserCircle size={48} />
                </AvatarFallback>
              )}
            </Avatar>
            <label 
              htmlFor="avatar-upload" 
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
            >
              <Camera size={24} className="text-white" />
              <span className="sr-only">Upload avatar</span>
            </label>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleAvatarUpload(e.target.files[0]);
                }
              }}
              disabled={uploadingAvatar}
            />
          </div>
          {uploadingAvatar && (
            <p className="text-xs text-muted-foreground mt-2">Uploading...</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* New Nickname field */}
          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Nickname
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle size={16} className="ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter a nickname that others will see</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <Input placeholder="How would you like to be called?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="hidden md:block">
            {/* Empty space for alignment */}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                <span>Bio</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-8 px-2"
                    >
                      <Plus size={12} className="mr-1" />
                      Add a prompt
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <Command>
                      <CommandList>
                        <CommandGroup heading="Bio Prompts">
                          {bioPrompts.map((prompt) => (
                            <CommandItem
                              key={prompt}
                              onSelect={() => handleBioPromptSelect(prompt)}
                            >
                              {prompt}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about yourself..." 
                  className="min-h-[120px]" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* New Cultural Insights field */}
        <FormField
          control={form.control}
          name="cultural_insight"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Cultural Insights
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle size={16} className="ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share cultural experiences or insights you'd like others to know</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Share cultural experiences or traditions you'd like to discuss..." 
                  className="min-h-[80px]" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Japanese, American" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Add Location Field Here */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Your current location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="student_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="international">International Student</SelectItem>
                    <SelectItem value="local">Local Student</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Searchable University Dropdown */}
          <FormField
            control={form.control}
            name="university"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>University</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="justify-between"
                      >
                        {field.value
                          ? universities.find((university) => university.id === field.value)?.name
                          : "Select university..."}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search university..."
                        className="h-9"
                        value={universitySearch}
                        onValueChange={setUniversitySearch}
                      />
                      <CommandEmpty>No university found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {filteredUniversities.map((university) => (
                            <CommandItem
                              key={university.id}
                              value={university.name}
                              onSelect={() => {
                                onUniversityChange(university.id);
                                setOpen(false);
                                setUniversitySearch('');
                              }}
                            >
                              {university.name}
                              {field.value === university.id && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="campus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campus</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value || ''}
                  disabled={!selectedUniversityId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {campuses.map((campus) => (
                      <SelectItem key={campus.id} value={campus.id}>
                        {campus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Searchable Major Dropdown */}
          <FormField
            control={form.control}
            name="major"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Major</FormLabel>
                <Popover open={openMajor} onOpenChange={setOpenMajor}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openMajor}
                        className="justify-between"
                      >
                        {field.value
                          ? majors.find((major) => major.id === field.value)?.name
                          : "Select major..."}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search major..."
                        className="h-9"
                        value={majorSearch}
                        onValueChange={setMajorSearch}
                      />
                      <CommandEmpty>No major found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {filteredMajors.map((major) => (
                            <CommandItem
                              key={major.id}
                              value={major.name}
                              onSelect={() => {
                                field.onChange(major.id);
                                setOpenMajor(false);
                                setMajorSearch('');
                              }}
                            >
                              {major.name}
                              {field.value === major.id && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year_of_study"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year of Study</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        Year {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Languages</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedLanguages.map((userLang) => {
                const lang = languages.find(l => l.id === userLang.language_id);
                if (!lang) return null;
                
                // Find the proficiency level object
                const profLevel = proficiencyLevels.find(p => p.value === userLang.proficiency);
                const starCount = profLevel?.stars || 1;
                
                return (
                  <Badge 
                    key={lang.id} 
                    variant="outline"
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/5"
                  >
                    {lang.name}
                    <span className="flex ml-1">
                      {Array.from({ length: starCount }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-amber-500 fill-amber-500" />
                      ))}
                      {Array.from({ length: 4 - starCount }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-muted-foreground" />
                      ))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => handleRemoveLanguage(lang.id)}
                    >
                      <X size={12} />
                    </Button>
                  </Badge>
                );
              })}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select onValueChange={setSelectedLanguage} value={selectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem 
                        key={language.id} 
                        value={language.id}
                      >
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedLanguage && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Proficiency Level</span>
                    <span className="text-sm text-muted-foreground">
                      {proficiencyLevels[Math.min(Math.max(Math.floor(languageProficiency[0]) - 1, 0), 3)]?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Beginner</span>
                    <Slider
                      value={languageProficiency}
                      min={1}
                      max={5}
                      step={1}
                      onValueChange={setLanguageProficiency}
                      className="flex-1"
                    />
                    <span className="text-xs">Native</span>
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleAddLanguage}
                    className="mt-2"
                  >
                    Add Language
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Interests</h3>
            <div className="space-y-4">
              <SelectedInterests
                selectedInterests={selectedInterests}
                onRemoveInterest={(interestId) => {
                  setSelectedInterests(selectedInterests.filter(id => id !== interestId));
                }}
                className="mb-4"
              />
              <InterestSelector
                selectedInterests={selectedInterests}
                onInterestChange={setSelectedInterests}
                maxInterests={10}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || loadingData || submitting}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProfileForm;
