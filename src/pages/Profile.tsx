
import React, { useEffect, useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserCircle, 
  Edit,
  X,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ProfileCompletionIndicator from '@/components/profile/ProfileCompletionIndicator';
import { motion } from 'framer-motion';
import ProfileForm from '@/components/profile/ProfileForm';
import ProfileView from '@/components/profile/ProfileView';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Profile = () => {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [majors, setMajors] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [interests, setInterests] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const { data: univData, error: univError } = await supabase
          .from('universities')
          .select('*')
          .order('name');
        
        if (univError) throw univError;
        setUniversities(univData || []);

        const { data: majorsData, error: majorsError } = await supabase
          .from('majors')
          .select('*')
          .order('name');
        
        if (majorsError) throw majorsError;
        setMajors(majorsData || []);

        const { data: languagesData, error: languagesError } = await supabase
          .from('languages')
          .select('*')
          .order('name');
        
        if (languagesError) throw languagesError;
        setLanguages(languagesData || []);

        const { data: interestsData, error: interestsError } = await supabase
          .from('interests')
          .select('*')
          .order('name');
        
        if (interestsError) throw interestsError;
        setInterests(interestsData || []);
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
      if (profile.campus_id) {
        supabase
          .from('campuses')
          .select('*')
          .eq('university_id', profile.university_id)
          .then(({ data, error }) => {
            if (!error && data) {
              setCampuses(data);
            }
          });
      }

      supabase
        .from('user_languages')
        .select('language_id, proficiency')
        .eq('user_id', profile.id)
        .then(({ data }) => {
          if (data) {
            setSelectedLanguages(data);
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
  }, [profile]);

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

  useEffect(() => {
    if (!loading && !profile) {
      // Profile is not loaded (null)
      navigate("/profile-setup");
    }
  }, [loading, profile, navigate]);


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
                <ProfileForm 
                  isEditing={isEditing} 
                  setIsEditing={setIsEditing} 
                />
              ) : (
                <ProfileView 
                  profile={profile}
                  universities={universities}
                  campuses={campuses}
                  majors={majors}
                  selectedLanguages={selectedLanguages}
                  selectedInterests={selectedInterests}
                  languages={languages}
                  interests={interests}
                />
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
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
