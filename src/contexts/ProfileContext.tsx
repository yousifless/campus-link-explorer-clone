import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { ProfileType } from '@/types/database';

type ProfileContextType = {
  profile: ProfileType | null;
  loading: boolean;
  updateProfile: (updates: Partial<ProfileType>) => Promise<void>;
  fetchProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const { data: userInterestsData, error: interestsError } = await supabase
        .from('user_interests')
        .select('interests(id, name)')
        .eq('user_id', user.id);

      if (interestsError) throw interestsError;

      const { data: userLanguagesData, error: languagesError } = await supabase
        .from('user_languages')
        .select('languages(id, name, code), proficiency')
        .eq('user_id', user.id);

      if (languagesError) throw languagesError;

      const interests = userInterestsData?.map((i: any) => 
        i.interests?.name || ''
      ).filter(Boolean) || [];
      
      const languages = userLanguagesData?.map((l: any) => 
        l.languages?.name || ''
      ) || [];

      let universityName = null;
      if (data?.campus_id) {
        const { data: campusData, error: campusError } = await supabase
          .from('campuses')
          .select('universities(name)')
          .eq('id', data.campus_id)
          .single();
          
        if (!campusError && campusData && campusData.universities) {
          universityName = campusData.universities.name || null;
        }
      }

      const studentType = data?.student_type === "international" || data?.student_type === "local" 
        ? data.student_type 
        : null;

      setProfile({
        ...data,
        interests,
        languages,
        university: universityName,
        student_type: studentType,
        is_verified: data?.is_verified || false
      } as ProfileType);
    } catch (error: any) {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<ProfileType>) => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user logged in");
      
      const { interests, languages, ...profileUpdates } = updates;
      
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (error) throw error;

      if (interests && interests.length > 0) {
        await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', user.id);

        for (const interestId of interests) {
          if (interestId) {
            await supabase
              .from('user_interests')
              .insert({ 
                user_id: user.id, 
                interest_id: interestId 
              });
          }
        }
      }

      if (languages && languages.length > 0) {
        await supabase
          .from('user_languages')
          .delete()
          .eq('user_id', user.id);

        for (const lang of languages) {
          if (lang && typeof lang === 'object' && 'id' in lang && 'proficiency' in lang) {
            if (lang.id) {
              const langId = lang.id;
              const proficiency = lang.proficiency || 'beginner';
              
              await supabase
                .from('user_languages')
                .insert({ 
                  user_id: user.id, 
                  language_id: langId,
                  proficiency: proficiency 
                });
            }
          }
        }
      }

      await fetchProfile();
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  const value = {
    profile,
    loading,
    updateProfile,
    fetchProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export type { ProfileType };
