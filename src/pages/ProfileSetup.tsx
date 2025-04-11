
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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

const studentTypes = [
  { label: 'International Student', value: 'international' },
  { label: 'Local Student', value: 'local' },
];

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
  studentType: z.string().min(1, {
    message: 'Please select your student type.',
  }),
  yearOfStudy: z.string().min(1, {
    message: 'Please select your year of study.',
  }),
  nationality: z.string().min(1, {
    message: 'Please enter your nationality.',
  }),
  bio: z.string().min(10, {
    message: 'Bio must be at least 10 characters.',
  }).max(500, {
    message: 'Bio must not exceed 500 characters.',
  })
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

const ProfileSetup = () => {
  const { updateProfile, loading } = useProfile();
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      university: '',
      campus: '',
      major: '',
      studentType: '',
      yearOfStudy: '',
      nationality: '',
      bio: '',
    },
  });

  // Fetch universities
  useEffect(() => {
    const fetchUniversities = async () => {
      const { data, error } = await supabase
        .from('universities')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching universities:', error);
        return;
      }
      
      setUniversities(data);
    };

    const fetchMajors = async () => {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching majors:', error);
        return;
      }
      
      setMajors(data);
    };

    fetchUniversities();
    fetchMajors();
  }, []);

  // Fetch campuses when university is selected
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
      
      setCampuses(data);
    };

    fetchCampuses();
  }, [selectedUniversityId]);

  const onUniversityChange = (value: string) => {
    setSelectedUniversityId(value);
    form.setValue('university', value);
    form.setValue('campus', '');
  };

  async function onSubmit(values: FormValues) {
    // Get campus object
    const selectedCampus = campuses.find(c => c.id === values.campus);
    
    await updateProfile({
      campus_id: values.campus,
      major_id: values.major,
      student_type: values.studentType as 'international' | 'local',
      year_of_study: parseInt(values.yearOfStudy),
      nationality: values.nationality,
      bio: values.bio,
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
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="university"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University</FormLabel>
                      <Select 
                        onValueChange={onUniversityChange}
                        defaultValue={field.value}
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
                        defaultValue={field.value}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="studentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="yearOfStudy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Study</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Japanese, American, etc." {...field} />
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
                        placeholder="Tell us about yourself, your interests, and what you're looking for in connections..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
