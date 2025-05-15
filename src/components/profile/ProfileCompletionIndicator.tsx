
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCompletionIndicatorProps {
  profile: any;
}

const ProfileCompletionIndicator = ({ profile }: ProfileCompletionIndicatorProps) => {
  if (!profile) return null;
  
  const requiredFields = [
    { key: 'first_name', label: 'First Name', priority: 'high' },
    { key: 'last_name', label: 'Last Name', priority: 'high' },
    { key: 'university_id', label: 'University', priority: 'high' },
    { key: 'major_id', label: 'Major', priority: 'high' },
    { key: 'student_type', label: 'Student Type', priority: 'high' },
    { key: 'bio', label: 'Bio', priority: 'medium' },
    { key: 'languages', label: 'Languages', priority: 'medium', isArray: true },
    { key: 'interests', label: 'Interests', priority: 'medium', isArray: true },
    { key: 'avatar_url', label: 'Profile Picture', priority: 'low' },
    { key: 'nationality', label: 'Nationality', priority: 'low' },
    { key: 'cultural_insight', label: 'Cultural Insights', priority: 'low' },
  ];

  const getCompletedFieldCount = () => {
    return requiredFields.filter(field => {
      if (field.isArray) {
        return profile[field.key] && Array.isArray(profile[field.key]) && profile[field.key].length > 0;
      }
      return profile[field.key] && profile[field.key].toString().trim() !== '';
    }).length;
  };

  const completedCount = getCompletedFieldCount();
  const totalCount = requiredFields.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const getStatusForField = (field: string, isArray = false) => {
    if (isArray) {
      return profile[field] && Array.isArray(profile[field]) && profile[field].length > 0;
    }
    return profile[field] && profile[field].toString().trim() !== '';
  };

  // Define colors based on completion percentage
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-gradient-to-r from-green-400 to-emerald-500';
    if (percentage >= 40) return 'bg-gradient-to-r from-amber-400 to-yellow-500';
    return 'bg-gradient-to-r from-rose-400 to-red-500';
  };

  const getMessageByCompletion = (percentage: number) => {
    if (percentage >= 80) return 'Your profile is looking great!';
    if (percentage >= 40) return 'You\'re making good progress!';
    return 'Let\'s complete your profile!';
  };

  const getIconByStatus = (completed: boolean, priority: string) => {
    if (completed) {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    if (priority === 'high') {
      return <AlertCircle size={16} className="text-rose-500" />;
    }
    return <Circle size={16} className="text-gray-300" />;
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden bg-white">
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
        <CardTitle className="text-lg font-medium text-amber-900 flex items-center gap-2">
          <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M8 12L11 15L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Profile Completion
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium">{completionPercentage}% Complete</span>
            <span className={cn("text-xs font-medium", getStatusColor(completionPercentage))}>
              {completedCount} of {totalCount} fields
            </span>
          </div>
          
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${getProgressColor(completionPercentage)}`}
            />
          </div>

          <p className={cn("text-sm mt-2", getStatusColor(completionPercentage))}>
            {getMessageByCompletion(completionPercentage)}
          </p>
        </div>

        <div className="space-y-1.5">
          {requiredFields.map((field, index) => {
            const isCompleted = getStatusForField(field.key, field.isArray);
            const icon = getIconByStatus(isCompleted, field.priority);
            
            return (
              <motion.div 
                key={field.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded-md",
                  isCompleted 
                    ? "bg-green-50" 
                    : field.priority === 'high'
                      ? "bg-red-50"
                      : "hover:bg-gray-50"
                )}
              >
                {icon}
                <span className={cn(
                  "text-sm",
                  isCompleted 
                    ? "text-green-700" 
                    : field.priority === 'high'
                      ? "text-red-700 font-medium"
                      : "text-gray-600"
                )}>
                  {field.label}
                </span>
                {field.priority === 'high' && !isCompleted && (
                  <span className="ml-auto text-xs font-medium text-red-500">Required</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionIndicator;
