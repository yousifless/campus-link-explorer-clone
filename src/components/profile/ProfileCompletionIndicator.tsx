
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ProfileType } from '@/types/database';
import { CheckCircle2, CircleAlert } from 'lucide-react';

interface ProfileCompletionIndicatorProps {
  profile: ProfileType | null;
}

const ProfileCompletionIndicator: React.FC<ProfileCompletionIndicatorProps> = ({ profile }) => {
  if (!profile) return null;

  // Fields to check for completion
  const fields = [
    !!profile.first_name,
    !!profile.last_name,
    !!profile.bio,
    !!profile.nationality,
    !!profile.student_type,
    !!profile.university,
    !!profile.campus_id,
    !!profile.major_id,
    !!profile.year_of_study,
    profile.languages && profile.languages.length > 0,
    profile.interests && profile.interests.length > 0
  ];

  // Calculate percentage
  const filledFields = fields.filter(Boolean).length;
  const totalFields = fields.length;
  const percentage = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="space-y-2 p-4 bg-white/50 rounded-lg border">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium flex items-center gap-1">
          {percentage === 100 ? (
            <CheckCircle2 size={16} className="text-green-500" />
          ) : (
            <CircleAlert size={16} className="text-amber-500" />
          )}
          Profile Completion
        </h3>
        <span className="text-sm font-semibold">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
      
      {percentage < 100 && (
        <p className="text-xs text-muted-foreground mt-1">
          Complete your profile to improve your matching experience.
        </p>
      )}
    </div>
  );
};

export default ProfileCompletionIndicator;
