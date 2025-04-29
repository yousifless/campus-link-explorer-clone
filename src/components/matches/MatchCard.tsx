
import React from 'react';
import { motion } from 'framer-motion';
import { MatchType } from '@/types/database';
import StudentProfileCard from '@/components/profile/StudentProfileCard';
import { useNavigate } from 'react-router-dom';

interface University { id: string; name: string; }
interface Major { id: string; name: string; }
interface Language { id: string; name: string; }
interface Interest { id: string; name: string; }

interface MatchCardProps {
  match: MatchType;
  universities: University[];
  majors: Major[];
  languages: Language[];
  interests: Interest[];
  isPending?: boolean;
  onAccept?: () => Promise<void>;
  onReject?: () => Promise<void>;
  onMessage?: () => void;
}

const MatchCard = ({
  match,
  universities = [],
  majors = [],
  languages = [],
  interests = [],
  isPending = false,
  onAccept,
  onReject,
  onMessage
}: MatchCardProps) => {
  const navigate = useNavigate();
  const otherUser = match.otherUser;

  const handleMessage = () => {
    if (onMessage) {
      onMessage();
    } else {
      navigate(`/chat/${match.id}`);
    }
  };

  // Map university and major IDs to names
  const universityObj = universities.find(u => u.id === otherUser.university);
  const majorObj = majors.find(m => m.id === otherUser.major);

  // Map language IDs to names (assuming otherUser.languages is an array of { id, proficiency })
  const userLanguages = (Array.isArray((otherUser as any).languages) ? (otherUser as any).languages : []).map((lang: any) => {
    const langObj = languages.find(l => l.id === lang.id);
    return langObj ? { id: langObj.name, proficiency: lang.proficiency } : null;
  }).filter(Boolean);

  // Map interest IDs to names
  const userInterests = (Array.isArray((otherUser as any).interests) ? (otherUser as any).interests : []).map((interestId: string) => {
    const interestObj = interests.find(i => i.id === interestId);
    return interestObj ? interestObj.name : interestId;
  });

  // Construct the profileData object for StudentProfileCard with fallbacks for missing properties
  const profileData = {
    id: otherUser.id,
    first_name: otherUser.first_name || '',
    last_name: otherUser.last_name || '',
    avatar_url: otherUser.avatar_url || '',
    bio: otherUser.bio || '',
    student_type: otherUser.student_type as 'international' | 'local' || null,
    major_id: otherUser.major || '',
    nationality: otherUser.nationality || '',
    is_verified: otherUser.is_verified,
    university_id: otherUser.university || '',
    year_of_study: (otherUser as any).year_of_study || null,
    location: (otherUser as any).location || null,
    languages: userLanguages,
    interests: userInterests,
    cultural_insight: (otherUser as any).cultural_insight || null,
    university: universityObj ? { id: universityObj.id, name: universityObj.name } : null,
    major: majorObj ? { id: majorObj.id, name: majorObj.name } : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Adding the missing properties
    nickname: null,
    campus_id: null,
    campus: null,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      <StudentProfileCard
        profile={profileData}
        matchScore={(otherUser as any).match_score}
        onConnect={isPending ? onAccept : undefined}
        onMessage={!isPending ? handleMessage : undefined}
        variant={isPending ? 'pink' : 'purple'}
      />
    </motion.div>
  );
};

export default MatchCard;
