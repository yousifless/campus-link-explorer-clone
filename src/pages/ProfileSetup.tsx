import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/integrations/supabase/enhanced-client';
import { PersonalInfoFields, BioFields, AcademicFields, NationalityField } from '@/components/profile/ProfileFormFields';
import { UniversityType, MajorType } from '@/types/database';
import { convertToUniversities, convertToMajors } from '@/utils/dataConverters';
import InterestSelector from '@/components/interests/InterestSelector';
import SelectedInterests from '@/components/interests/SelectedInterests';
import { uploadAvatar } from '@/utils/storage';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle, Camera } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const formSchema = z.object({
  university_id: z.string().min(1, {
    message: 'Please select your university.',
  }),
  campus_id: z.string().min(1, {
    message: 'Please select your campus.',
  }),
  major_id: z.string().min(1, {
    message: 'Please select your major.',
  }),
  student_type: z.enum(['international', 'local'], {
    required_error: 'Please select your student type.',
  }),
  year_of_study: z.string().min(1, {
    message: 'Please select your year of study.',
  }),
  nationality: z.string().min(1, {
    message: 'Please enter your nationality.',
  }),
  bio: z.string().min(10, {
    message: 'Bio must be at least 10 characters.',
  }).max(500, {
    message: 'Bio must not exceed 500 characters.',
  }),
  nickname: z.string().optional(),
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  cultural_insight: z.string().max(300, { message: 'Cultural insight must not exceed 300 characters' }).optional(),
  interests: z.array(z.string()).min(1, { message: 'Please select at least one interest' }),
  avatar_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ProfileSetup = () => {
  const { updateProfile, loading } = useProfile();
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<UniversityType[]>([]);
  const [majors, setMajors] = useState<MajorType[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [bioPrompts, setBioPrompts] = useState<string[]>([
    "What are your hobbies?",
    "What are you studying and why?",
    "What's your favorite place in Japan?",
    "What's a cultural experience you'd like to share?",
    "What kind of friends are you looking for?"
  ]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      university_id: '',
      campus_id: '',
      major_id: '',
      student_type: 'international',
      year_of_study: '',
      nationality: '',
      bio: '',
      nickname: '',
      first_name: '',
      last_name: '',
      cultural_insight: '',
      interests: [],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: univData, error: univError } = await db.universities()
          .select('*')
          .order('name');
        
        if (univError) throw univError;
        setUniversities(convertToUniversities(univData));

        const { data: majorsData, error: majorsError } = await db.majors()
          .select('*')
          .order('name');
        
        if (majorsError) throw majorsError;
        setMajors(convertToMajors(majorsData));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const onUniversityChange = (value: string) => {
    setSelectedUniversityId(value);
    form.setValue('campus_id', '');
  };

  const handleBioPromptSelect = (prompt: string) => {
    const currentBio = form.getValues('bio');
    form.setValue('bio', currentBio ? `${currentBio}\n\n${prompt}` : prompt);
  };

  const handleInterestChange = (interests: string[]) => {
    setSelectedInterests(interests);
    form.setValue('interests', interests);
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload the avatar using our utility function
      const avatarUrl = await uploadAvatar(file);
      
      // Store the avatar URL in the form data
      form.setValue('avatar_url', avatarUrl);
      
      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been uploaded successfully.",
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

  async function onSubmit(values: FormValues) {
    try {
      setLoadingProfile(true);
      
      // Convert year_of_study to number
      const yearOfStudy = values.year_of_study ? parseInt(values.year_of_study) : null;
      
      // Prepare the profile data
      const profileData = {
        ...values,
        year_of_study: yearOfStudy,
        interests: selectedInterests,
        student_type: values.student_type as 'international' | 'local'
      };
      
      // Create the profile
      await updateProfile(profileData);
      
      // Navigate to the feed page
      navigate('/feed');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error creating profile",
        description: "There was a problem creating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Fill in your details to get started with CampusLink
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-primary/20 transition-all hover:border-primary/40">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt="Avatar preview" />
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
              
              <PersonalInfoFields form={form} />
              <AcademicFields
                form={form}
                universities={universities}
                majors={majors}
                selectedUniversityId={selectedUniversityId}
                onUniversityChange={onUniversityChange}
              />
              <NationalityField form={form} />
              <BioFields 
                form={form} 
                bioPrompts={bioPrompts} 
                onPromptSelect={handleBioPromptSelect} 
              />
              
              <div className="space-y-4">
                <FormLabel>Interests</FormLabel>
                <FormField
                  control={form.control}
                  name="interests"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <InterestSelector
                          selectedInterests={selectedInterests}
                          onInterestChange={handleInterestChange}
                          maxInterests={10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedInterests.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Selected Interests:</h4>
                    <SelectedInterests
                      selectedInterests={selectedInterests}
                      onRemoveInterest={(id) => handleInterestChange(selectedInterests.filter(i => i !== id))}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loadingProfile}>
                {loadingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
