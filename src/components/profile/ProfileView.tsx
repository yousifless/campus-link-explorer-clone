
import React from 'react';
import { motion } from 'framer-motion';
import { ProfileType, University, Campus, Language } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  GraduationCap, 
  Globe, 
  Flag, 
  Building, 
  Languages as LanguagesIcon,
  Heart,
  CalendarClock,
  Map
} from 'lucide-react';
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

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

  const proficiencyColors = {
    beginner: 'bg-blue-50 border-blue-200 text-blue-700',
    intermediate: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    advanced: 'bg-violet-50 border-violet-200 text-violet-700',
    native: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <div className="space-y-8">
      {profile.bio && (
        <motion.div 
          variants={itemVariants} 
          className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 -mt-10 -mr-10 bg-yellow-200 rounded-full opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 -mb-8 -ml-8 bg-amber-200 rounded-full opacity-20"></div>
          <p className="text-gray-700 relative z-10">{profile.bio}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education Section */}
        <motion.div 
          variants={itemVariants}
          className="col-span-1"
        >
          <Card className="border-0 shadow-md overflow-hidden h-full bg-gradient-to-br from-white to-blue-50">
            <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <h3 className="font-medium text-lg flex items-center gap-2 text-blue-900">
                <GraduationCap className="text-blue-600" size={20} />
                Education
              </h3>
            </div>
            
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="min-w-8 min-h-8 mt-0.5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Building size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">University</p>
                  <p className="font-medium">{profile.university ? profile.university.name : getUniversityName(profile.university_id)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="min-w-8 min-h-8 mt-0.5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Map size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Campus</p>
                  <p className="font-medium">{profile.campus ? profile.campus.name : getCampusName(profile.campus_id)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="min-w-8 min-h-8 mt-0.5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Major</p>
                  <p className="font-medium">{getMajorName(profile.major_id)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="min-w-8 min-h-8 mt-0.5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <CalendarClock size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Year of Study</p>
                  <p className="font-medium">{profile.year_of_study || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Background Section */}
        <motion.div 
          variants={itemVariants}
          className="col-span-1"
        >
          <Card className="border-0 shadow-md overflow-hidden h-full bg-gradient-to-br from-white to-purple-50">
            <div className="p-5 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
              <h3 className="font-medium text-lg flex items-center gap-2 text-purple-900">
                <Flag className="text-purple-600" size={20} />
                Background
              </h3>
            </div>
            
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="min-w-8 min-h-8 mt-0.5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Globe size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium">{profile.nationality || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="min-w-8 min-h-8 mt-0.5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Flag size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cultural Insights</p>
                  <p className="font-medium">{profile.cultural_insight || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Languages Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-white to-indigo-50">
          <div className="p-5 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
            <h3 className="font-medium text-lg flex items-center gap-2 text-indigo-900">
              <LanguagesIcon className="text-indigo-600" size={20} />
              Languages
            </h3>
          </div>
          
          <CardContent className="p-5">
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
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Badge 
                        variant="outline" 
                        className={`px-3 py-1.5 ${proficiencyColors[proficiency] || proficiencyColors.intermediate}`}
                      >
                        {lang}
                        <span className="ml-1 text-xs opacity-80">({proficiency})</span>
                      </Badge>
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-gray-500">No languages specified</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Interests Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-white to-pink-50">
          <div className="p-5 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
            <h3 className="font-medium text-lg flex items-center gap-2 text-pink-900">
              <Heart className="text-pink-600" size={20} />
              Interests
            </h3>
          </div>
          
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-2">
              {profile.interests && profile.interests.length > 0 ? (
                profile.interests.map((interestId, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Badge 
                      variant="outline" 
                      className="px-3 py-1.5 bg-pink-50 border-pink-200 text-pink-700"
                    >
                      {getInterestName(interestId)}
                    </Badge>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500">No interests specified</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProfileView;
