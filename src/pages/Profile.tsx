import React, { useEffect, useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
  UserCircle, 
  School, 
  BookOpen, 
  Globe, 
  Languages, 
  Heart,
  Edit,
  Check,
  X,
  Camera
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/integrations/supabase/enhanced-client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ProfileCompletionIndicator from '@/components/profile/ProfileCompletionIndicator';
import { motion } from 'framer-motion';

const studentTypes = [
  { label: 'International Student', value: 'international' },
  { label: 'Local Student', value: 'local' },
];

const formSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  bio: z.string().max(500, { message: 'Bio must not exceed 500 characters' }).optional(),
  nationality: z.string().optional(),
  year_of_study: z.string().optional(),
  university: z.string().optional(),
  campus: z.string().optional(),
  major: z.string().optional(),
  student_type: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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

const Profile = () => {
  const { profile, updateProfile, loading, fetchProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      bio: '',
      nationality: '',
      year_of_study: '',
      university: '',
      campus: '',
      major: '',
      student_type: '',
    },
  });

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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        nationality: profile.nationality || '',
        year_of_study: profile.year_of_study?.toString() || '',
        university: profile.university || '',
        campus: profile.campus_id || '',
        major: profile.major_id || '',
        student_type: profile.student_type || '',
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

      supabase
        .from('user_languages')
        .select('language_id, proficiency')
        .eq('user_id', profile.id)
        .then(({ data }) => {
          if (data) {
            setSelectedLanguages(data as UserLanguage[]);
          }
        });

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

  const onUniversityChange = (value: string) => {
    setSelectedUniversityId(value);
    form.setValue('university', value);
    form.setValue('campus', '');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !profile) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-avatar.${fileExt}`;
    
    try {
      setUploadingAvatar(true);
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      await updateProfile({ 
        avatar_url: publicUrlData.publicUrl 
      });
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAddLanguage = async (languageId: string, proficiency: string) => {
    if (selectedLanguages.some(l => l.language_id === languageId)) {
      setSelectedLanguages(
        selectedLanguages.map(l => 
          l.language_id === languageId ? { ...l, proficiency } : l
        )
      );
    } else {
      setSelectedLanguages([
        ...selectedLanguages,
        { language_id: languageId, proficiency }
      ]);
    }
  };

  const handleRemoveLanguage = (languageId: string) => {
    setSelectedLanguages(selectedLanguages.filter(l => l.language_id !== languageId));
  };

  const handleInterestToggle = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      setSelectedInterests([...selectedInterests, interestId]);
    }
  };

  async function onSubmit(values: FormValues) {
    const updates = {
      first_name: values.first_name,
      last_name: values.last_name,
      bio: values.bio,
      nationality: values.nationality,
      year_of_study: values.year_of_study ? parseInt(values.year_of_study) : null,
      campus_id: values.campus || null,
      major_id: values.major || null,
      student_type: values.student_type as 'international' | 'local' | null,
    };

    await updateProfile(updates);

    await Promise.all(selectedLanguages.map(async lang => {
      await supabase
        .from('user_languages')
        .delete()
        .eq('user_id', profile?.id)
        .eq('language_id', lang.language_id);
      
      await supabase
        .from('user_languages')
        .insert({
          user_id: profile?.id,
          language_id: lang.language_id,
          proficiency: lang.proficiency
        });
    }));

    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', profile?.id);
    
    if (selectedInterests.length > 0) {
      const interestRecords = selectedInterests.map(interestId => ({
        user_id: profile?.id,
        interest_id: interestId
      }));
      
      await supabase
        .from('user_interests')
        .insert(interestRecords);
    }

    await fetchProfile();
    setIsEditing(false);
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (loading && !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="shadow-lg h-full transition-all hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
                <CardDescription>
                  Manage your profile information
                </CardDescription>
              </div>
              <Button
                variant={isEditing ? 'outline' : 'default'}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="transition-all hover:scale-105"
              >
                {isEditing ? (
                  <>
                    <X size={16} className="mr-1" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit size={16} className="mr-1" />
                    Edit Profile
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        />
                      </div>
                      {uploadingAvatar && (
                        <p className="text-xs text-muted-foreground mt-2">Uploading...</p>
                      )}
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
                          <FormLabel>Bio</FormLabel>
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
                                {studentTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
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
                      <FormField
                        control={form.control}
                        name="university"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>University</FormLabel>
                            <Select 
                              onValueChange={onUniversityChange}
                              defaultValue={field.value || ''}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select university" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {universities.map((university) => (
                                  <SelectItem key={university.id} value={university.id}>
                                    {university.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                      <FormField
                        control={form.control}
                        name="major"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Major</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value || ''}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select major" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {majors.map((major) => (
                                  <SelectItem key={major.id} value={major.id}>
                                    {major.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                        <h3 className="text-lg font-medium mb-2">Languages</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedLanguages.map((userLang) => {
                            const lang = languages.find(l => l.id === userLang.language_id);
                            if (!lang) return null;
                            
                            return (
                              <Badge 
                                key={lang.id} 
                                variant="outline"
                                className="flex items-center gap-1 px-3 py-1.5"
                              >
                                {lang.name}
                                <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded ml-1">
                                  {userLang.proficiency}
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
                        <div className="grid grid-cols-2 gap-4">
                          <Select onValueChange={(value) => {}}>
                            <SelectTrigger>
                              <SelectValue placeholder="Add a language" />
                            </SelectTrigger>
                            <SelectContent>
                              {languages.map((language) => (
                                <SelectItem 
                                  key={language.id} 
                                  value={language.id}
                                  onSelect={() => {}}
                                >
                                  {language.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select 
                            disabled={!languages.length} 
                            onValueChange={(proficiency) => {
                              const selectedLangId = document.querySelector<HTMLDivElement>('[data-radix-select-value]')?.textContent;
                              const language = languages.find(l => l.name === selectedLangId);
                              if (language) {
                                handleAddLanguage(language.id, proficiency);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Proficiency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="native">Native</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {interests.map((interest) => {
                            const isSelected = selectedInterests.includes(interest.id);
                            return (
                              <Badge 
                                key={interest.id} 
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleInterestToggle(interest.id)}
                              >
                                {interest.name}
                                {isSelected && (
                                  <Check size={12} className="ml-1" />
                                )}
                              </Badge>
                            );
                          })}
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
                        disabled={loading || loadingData}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="profile" className="transition-all data-[state=active]:font-medium">Profile</TabsTrigger>
                      <TabsTrigger value="interests" className="transition-all data-[state=active]:font-medium">Interests & Languages</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile" className="animate-fade-in">
                      <div className="space-y-6">
                        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4">
                          <div className="flex-shrink-0">
                            <Avatar className="h-24 w-24 border-2 border-primary/20 transition-all hover:border-primary/40">
                              {profile?.avatar_url ? (
                                <AvatarImage src={profile.avatar_url} alt={`${profile.first_name} ${profile.last_name}`} />
                              ) : (
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  <UserCircle size={48} />
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold">
                              {profile?.first_name} {profile?.last_name}
                            </h2>
                            <p className="text-muted-foreground flex items-center gap-1 mt-1">
                              {profile?.student_type === 'international' ? 'International Student' : 'Local Student'}
                              {profile?.nationality && ` • ${profile?.nationality}`}
                              {profile?.is_verified && (
                                <Badge variant="outline" className="ml-2 bg-primary/5">
                                  <Check size={12} className="mr-1 text-primary" />
                                  Verified
                                </Badge>
                              )}
                            </p>
                            <p className="mt-3">{profile?.bio || "No bio provided."}</p>
                          </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2 p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/40">
                            <h3 className="text-lg font-medium flex items-center">
                              <School size={18} className="mr-2 text-primary" />
                              Education
                            </h3>
                            <div className="space-y-1 pl-6">
                              <p><span className="font-medium">University:</span> {profile?.university || "Not specified"}</p>
                              <p><span className="font-medium">Major:</span> {majors.find(m => m.id === profile?.major_id)?.name || "Not specified"}</p>
                              <p><span className="font-medium">Year:</span> {profile?.year_of_study || "Not specified"}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/40">
                            <h3 className="text-lg font-medium flex items-center">
                              <Globe size={18} className="mr-2 text-primary" />
                              Location
                            </h3>
                            <div className="space-y-1 pl-6">
                              <p><span className="font-medium">Campus:</span> {campuses.find(c => c.id === profile?.campus_id)?.name || "Not specified"}</p>
                              <p><span className="font-medium">City:</span> {universities.find(u => u.id === selectedUniversityId)?.location || "Not specified"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="interests" className="animate-fade-in">
                      <div className="space-y-6">
                        <div className="p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/40">
                          <h3 className="text-lg font-medium flex items-center mb-3">
                            <Languages size={18} className="mr-2 text-primary" />
                            Languages
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedLanguages.length === 0 ? (
                              <p className="text-muted-foreground">No languages added yet.</p>
                            ) : (
                              selectedLanguages.map((userLang, index) => {
                                const lang = languages.find(l => l.id === userLang.language_id);
                                if (!lang) return null;
                                
                                return (
                                  <Badge 
                                    key={lang.id} 
                                    variant="secondary"
                                    className="px-3 py-1.5 transition-all hover:bg-secondary/80"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    {lang.name}
                                    <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded ml-1">
                                      {userLang.proficiency}
                                    </span>
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/40">
                          <h3 className="text-lg font-medium flex items-center mb-3">
                            <Heart size={18} className="mr-2 text-primary" />
                            Interests
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedInterests.length === 0 ? (
                              <p className="text-muted-foreground">No interests added yet.</p>
                            ) : (
                              selectedInterests.map((interestId, index) => {
                                const interest = interests.find(i => i.id === interestId);
                                if (!interest) return null;
                                
                                return (
                                  <Badge 
                                    key={interest.id}
                                    variant="outline" 
                                    className="px-3 py-1.5 transition-all hover:bg-muted/50"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    {interest.name}
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ProfileCompletionIndicator profile={profile} />
          
          <Card className="transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start transition-all hover:bg-muted/50 hover:translate-x-1"
                      size="sm"
                    >
                      <UserCircle className="mr-2" size={16} />
                      View Public Profile
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>See how others view your profile</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start transition-all hover:bg-muted/50 hover:translate-x-1"
                      size="sm"
                    >
                      <BookOpen className="mr-2" size={16} />
                      View Academic Records
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Access your courses, grades, and academic achievements</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
