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
import { University, Major } from '@/types/database';
import { convertToUniversities, convertToMajors } from '@/utils/dataConverters';

const formSchema = z.object({
  university: z.string().min(1, {
    message: 'Please select your university.',
  }),
  campus: z.string().min(1, {
    message: 'Please select your campus.',
  }),
  major: z.string().min(1, {
    message: 'Please select your major.',
  }),
  student_type: z.string().min(1, {
    message: 'Please select your student type.',
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
});

type FormValues = z.infer<typeof formSchema>;

const ProfileSetup = () => {
  const { updateProfile, loading } = useProfile();
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [bioPrompts, setBioPrompts] = useState<string[]>([
    "What are your hobbies?",
    "What are you studying and why?",
    "What's your favorite place in Japan?",
    "What's a cultural experience you'd like to share?",
    "What kind of friends are you looking for?"
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      university: '',
      campus: '',
      major: '',
      student_type: '',
      year_of_study: '',
      nationality: '',
      bio: '',
      nickname: '',
      first_name: '',
      last_name: '',
      cultural_insight: '',
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
    form.setValue('university', value);
    form.setValue('campus', '');
  };

  const handleBioPromptSelect = (prompt: string) => {
    const currentBio = form.getValues('bio') || '';
    form.setValue('bio', currentBio ? `${currentBio}\n\n${prompt}` : prompt);
  };

  async function onSubmit(values: FormValues) {
    await updateProfile({
      nickname: values.nickname,
      first_name: values.first_name,
      last_name: values.last_name,
      campus_id: values.campus,
      major_id: values.major,
      student_type: values.student_type as 'international' | 'local',
      year_of_study: parseInt(values.year_of_study),
      nationality: values.nationality,
      bio: values.bio,
      cultural_insight: values.cultural_insight,
    });

    navigate('/profile');
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Set up your profile</CardTitle>
          <CardDescription>
            Complete your profile information to get better matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <PersonalInfoFields form={form} />
              </div>

              {/* Bio Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">About You</h3>
                <BioFields 
                  form={form} 
                  bioPrompts={bioPrompts}
                  handleBioPromptSelect={handleBioPromptSelect}
                />
              </div>

              {/* Academic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Academic Information</h3>
                <AcademicFields 
                  form={form}
                  universities={universities}
                  majors={majors}
                  selectedUniversityId={selectedUniversityId}
                  onUniversityChange={onUniversityChange}
                />
              </div>

              {/* Nationality Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Nationality</h3>
                <NationalityField form={form} />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Saving profile...' : 'Complete Profile Setup'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
