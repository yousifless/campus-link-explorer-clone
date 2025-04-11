
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

export type ProfileType = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  university: string | null;
  campus_id: string | null;
  major_id: string | null;
  bio: string | null;
  avatar_url: string | null;
  student_type: 'international' | 'local' | null;
  year_of_study: number | null;
  nationality: string | null;
  is_verified: boolean;
  interests: string[] | null;
  languages: string[] | null;
};

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
        .select('*, universities(name), majors(name)')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Fetch user interests
      const { data: interestsData, error: interestsError } = await supabase
        .from('user_interests')
        .select('interests(name)')
        .eq('user_id', user.id);

      if (interestsError) throw interestsError;

      // Fetch user languages
      const { data: languagesData, error: languagesError } = await supabase
        .from('user_languages')
        .select('languages(name, code), proficiency')
        .eq('user_id', user.id);

      if (languagesError) throw languagesError;

      const interests = interestsData.map((i: any) => i.interests.name);
      const languages = languagesData.map((l: any) => ({ 
        name: l.languages.name, 
        code: l.languages.code,
        proficiency: l.proficiency 
      }));

      setProfile({
        ...data,
        interests,
        languages,
        university: data.universities?.name || null
      });
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
      
      // Only update the core profile fields
      const { interests, languages, ...profileUpdates } = updates;
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (error) throw error;

      // Update interests if provided
      if (interests) {
        // First, delete existing interests
        await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', user.id);

        // Then, add new interests
        for (const interestId of interests) {
          await supabase
            .from('user_interests')
            .insert({ user_id: user.id, interest_id: interestId });
        }
      }

      // Update languages if provided
      if (languages) {
        // First, delete existing languages
        await supabase
          .from('user_languages')
          .delete()
          .eq('user_id', user.id);

        // Then, add new languages
        for (const lang of languages) {
          await supabase
            .from('user_languages')
            .insert({ 
              user_id: user.id, 
              language_id: lang.id,
              proficiency: lang.proficiency 
            });
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
