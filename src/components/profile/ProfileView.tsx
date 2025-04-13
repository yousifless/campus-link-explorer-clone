
import React from 'react';
import { ProfileType } from '@/types/database';
import { 
  UserCircle, 
  School, 
  Globe, 
  Languages, 
  Heart,
  Star,
  MapPin,
  Book,
  Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

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

interface ProfileViewProps {
  profile: ProfileType | null;
  universities: University[];
  campuses: Campus[];
  majors: Major[];
  selectedLanguages: UserLanguage[];
  selectedInterests: string[];
  languages: any[];
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
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (!profile) return null;

  return (
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
                  {profile?.nickname ? profile.nickname : `${profile?.first_name} ${profile?.last_name}`}
                  {profile?.nickname && <span className="text-sm ml-2 text-muted-foreground">({profile?.first_name} {profile?.last_name})</span>}
                </h2>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  {profile?.student_type === 'international' ? 'International Student' : 'Local Student'}
                  {profile?.nationality && ` • ${profile?.nationality}`}
                  {profile?.is_verified && (
                    <Badge variant="outline" className="ml-2 bg-primary/5">
                      <Star size={12} className="mr-1 text-primary fill-primary" />
                      Verified
                    </Badge>
                  )}
                </p>
                <p className="mt-3 whitespace-pre-line">{profile?.bio || "No bio provided."}</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <motion.div 
                className="space-y-2 p-4 rounded-lg transition-all hover:bg-muted/40 border"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <h3 className="text-lg font-medium flex items-center">
                  <School size={18} className="mr-2 text-primary" />
                  Education
                </h3>
                <div className="space-y-1 pl-6">
                  <p className="flex items-start">
                    <Book size={14} className="mr-2 mt-1 text-muted-foreground" />
                    <span><span className="font-medium">University:</span> {profile?.university || "Not specified"}</span>
                  </p>
                  <p className="flex items-start">
                    <Book size={14} className="mr-2 mt-1 text-muted-foreground" />
                    <span><span className="font-medium">Major:</span> {majors.find(m => m.id === profile?.major_id)?.name || "Not specified"}</span>
                  </p>
                  <p className="flex items-start">
                    <Calendar size={14} className="mr-2 mt-1 text-muted-foreground" />
                    <span><span className="font-medium">Year:</span> {profile?.year_of_study ? `Year ${profile.year_of_study}` : "Not specified"}</span>
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                className="space-y-2 p-4 rounded-lg transition-all hover:bg-muted/40 border"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <h3 className="text-lg font-medium flex items-center">
                  <Globe size={18} className="mr-2 text-primary" />
                  Location
                </h3>
                <div className="space-y-1 pl-6">
                  <p className="flex items-start">
                    <MapPin size={14} className="mr-2 mt-1 text-muted-foreground" />
                    <span><span className="font-medium">Campus:</span> {campuses.find(c => c.id === profile?.campus_id)?.name || "Not specified"}</span>
                  </p>
                  <p className="flex items-start">
                    <MapPin size={14} className="mr-2 mt-1 text-muted-foreground" />
                    <span><span className="font-medium">City:</span> {universities.find(u => u.id === profile?.university)?.location || "Not specified"}</span>
                  </p>
                </div>
              </motion.div>
            </div>

            {profile.cultural_insight && (
              <motion.div 
                className="p-4 space-y-2 rounded-lg transition-all hover:bg-muted/40 border"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <h3 className="text-lg font-medium flex items-center">
                  <Globe size={18} className="mr-2 text-primary" />
                  Cultural Insights
                </h3>
                <p className="pl-6 whitespace-pre-line">{profile.cultural_insight}</p>
              </motion.div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="interests" className="animate-fade-in">
          <div className="space-y-6">
            <motion.div 
              className="p-4 rounded-lg transition-all hover:bg-muted/40 border"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
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
                    
                    // Find the proficiency level object
                    const profLevel = proficiencyLevels.find(p => p.value === userLang.proficiency);
                    const starCount = profLevel?.stars || 1;
                    
                    return (
                      <Badge 
                        key={lang.id} 
                        variant="secondary"
                        className="px-3 py-1.5 transition-all hover:bg-secondary/80"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {lang.name}
                        <span className="flex ml-2">
                          {Array.from({ length: starCount }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-amber-500 fill-amber-500" />
                          ))}
                          {Array.from({ length: 4 - starCount }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-muted-foreground" />
                          ))}
                        </span>
                      </Badge>
                    );
                  })
                )}
              </div>
            </motion.div>
            
            <motion.div 
              className="p-4 rounded-lg transition-all hover:bg-muted/40 border"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
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
                    
                    // Assign different colors based on interest categories
                    const getColor = (category: string) => {
                      switch(category) {
                        case 'sports': return 'bg-blue-100 text-blue-800';
                        case 'arts': return 'bg-purple-100 text-purple-800';
                        case 'technology': return 'bg-green-100 text-green-800';
                        case 'academics': return 'bg-amber-100 text-amber-800';
                        default: return 'bg-primary/10 text-primary-foreground';
                      }
                    };
                    
                    return (
                      <Badge 
                        key={interest.id}
                        variant="outline" 
                        className={`px-3 py-1.5 transition-all ${getColor(interest.category)}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {interest.name}
                      </Badge>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileView;
