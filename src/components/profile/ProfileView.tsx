
import React from 'react';
import { ProfileType, University, Campus, Language } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { GraduationCap, Globe, Flag, Building, Languages as LanguagesIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProfileViewProps {
  profile: ProfileType | null;
  universities: University[];
  campuses: Campus[];
  majors: any[];
  selectedLanguages: any[];
  selectedInterests: string[];
  languages: Language[];
  interests: any[];
}

const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  universities,
  campuses,
  majors,
  selectedLanguages,
  selectedInterests,
  languages,
  interests
}) => {
  if (!profile) return null;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getUniversityName = (id?: string | null) => {
    if (!id) return 'Not specified';
    const university = universities.find(u => u.id === id);
    return university?.name || 'Unknown';
  };

  const getCampusName = (id?: string | null) => {
    if (!id) return 'Not specified';
    const campus = campuses.find(c => c.id === id);
    return campus?.name || 'Main campus';
  };

  const getMajorName = (id?: string | null) => {
    if (!id) return 'Not specified';
    const major = majors.find(m => m.id === id);
    return major?.name || 'Unknown';
  };

  const getLanguageName = (id: string) => {
    const language = languages.find(l => l.id === id);
    return language?.name || id;
  };

  const getInterestName = (id: string) => {
    const interest = interests.find(i => i.id === id);
    return interest?.name || id;
  };

  const getLanguageProficiency = (languageId: string) => {
    const userLanguage = selectedLanguages.find(ul => ul.language_id === languageId);
    return userLanguage?.proficiency || 'intermediate';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24 md:h-32 md:w-32">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.first_name || 'User'} />
            <AvatarFallback className="bg-blue-600 text-white text-xl">
              {getInitials(profile.first_name, profile.last_name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <h2 className="text-2xl font-bold">
              {profile.first_name} {profile.last_name}
            </h2>
            {profile.nickname && (
              <p className="text-gray-500">"{profile.nickname}"</p>
            )}
          </div>

          {profile.bio && (
            <div>
              <p className="text-gray-600 dark:text-gray-300">{profile.bio}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {profile.student_type && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {profile.student_type === 'international' ? 'International Student' : 'Local Student'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <GraduationCap size={18} className="text-blue-600" />
            Education
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">University</p>
              <p>{profile.university ? profile.university.name : getUniversityName(profile.university_id)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Campus</p>
              <p>{profile.campus ? profile.campus.name : getCampusName(profile.campus_id)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Major</p>
              <p>{getMajorName(profile.major_id)}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Year of Study</p>
              <p>{profile.year_of_study || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <Separator />
        
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Flag size={18} className="text-blue-600" />
            Background
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Nationality</p>
              <p>{profile.nationality || 'Not specified'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Cultural Insights</p>
              <p>{profile.cultural_insight || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <LanguagesIcon size={18} className="text-blue-600" />
            Languages
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {profile.languages && profile.languages.length > 0 ? (
              profile.languages.map((language, idx) => {
                const lang = typeof language === 'string' 
                  ? language 
                  : getLanguageName(language.id);
                  
                const proficiency = typeof language === 'string'
                  ? 'intermediate'
                  : language.proficiency;
                
                return (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="px-3 py-1 bg-indigo-50 border-indigo-200 text-indigo-700"
                  >
                    {lang}
                    <span className="ml-1 text-xs opacity-70">({proficiency})</span>
                  </Badge>
                );
              })
            ) : (
              <p className="text-gray-500">No languages specified</p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Globe size={18} className="text-blue-600" />
            Interests
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {profile.interests && profile.interests.length > 0 ? (
              profile.interests.map((interestId, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="px-3 py-1 bg-green-50 border-green-200 text-green-700"
                >
                  {getInterestName(interestId)}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500">No interests specified</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
