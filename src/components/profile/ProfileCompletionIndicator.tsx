
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ProfileType } from '@/types/database';
import { CheckCircle2, CircleAlert, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProfileCompletionIndicatorProps {
  profile: ProfileType | null;
}

const ProfileCompletionIndicator: React.FC<ProfileCompletionIndicatorProps> = ({ profile }) => {
  if (!profile) return null;

  // Fields to check for completion
  const fields = [
    { name: 'first_name', value: !!profile.first_name, label: 'First Name' },
    { name: 'last_name', value: !!profile.last_name, label: 'Last Name' },
    { name: 'bio', value: !!profile.bio, label: 'Bio' },
    { name: 'nationality', value: !!profile.nationality, label: 'Nationality' },
    { name: 'student_type', value: !!profile.student_type, label: 'Student Type' },
    { name: 'university', value: !!profile.university, label: 'University' },
    { name: 'campus_id', value: !!profile.campus_id, label: 'Campus' },
    { name: 'major_id', value: !!profile.major_id, label: 'Major' },
    { name: 'year_of_study', value: !!profile.year_of_study, label: 'Year of Study' },
    { name: 'languages', value: profile.languages && profile.languages.length > 0, label: 'Languages' },
    { name: 'interests', value: profile.interests && profile.interests.length > 0, label: 'Interests' }
  ];

  // Calculate percentage
  const filledFields = fields.filter(field => field.value).length;
  const totalFields = fields.length;
  const percentage = Math.round((filledFields / totalFields) * 100);

  // Get incomplete fields
  const incompleteFields = fields.filter(field => !field.value).map(field => field.label);

  return (
    <div className="space-y-3 p-4 bg-white/50 rounded-lg border shadow-sm transition-all hover:shadow">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          {percentage === 100 ? (
            <CheckCircle2 size={16} className="text-green-500" />
          ) : (
            <CircleAlert size={16} className="text-amber-500" />
          )}
          Profile Completion
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex" aria-label="Profile completion information">
                  <Info size={14} className="text-muted-foreground ml-1" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px]" side="right">
                <p className="text-sm">Complete your profile to enhance your matching experience and help others find you.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
        <span className="text-sm font-semibold">{percentage}%</span>
      </div>
      
      <Progress value={percentage} className="h-2.5 transition-all" />
      
      {percentage < 100 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Complete your profile to improve your matching experience.
          </p>
          
          {incompleteFields.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Missing information:</p>
              <ul className="text-xs text-muted-foreground pl-4 list-disc">
                {incompleteFields.slice(0, 3).map((field, index) => (
                  <li key={index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    Add your {field.toLowerCase()}
                  </li>
                ))}
                {incompleteFields.length > 3 && (
                  <li>And {incompleteFields.length - 3} more...</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionIndicator;
