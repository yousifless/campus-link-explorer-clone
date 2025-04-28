import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users } from "lucide-react";

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    avatar?: string;
    university: string;
    major: string;
    studentType: "local" | "international";
    interests: string[];
    languages: string[];
    bio: string;
    matchPercentage?: number;
  };
  variant?: "compact" | "full";
  onConnect?: (id: string) => void;
  onMessage?: (id: string) => void;
}

export function ProfileCard({ profile, variant = "full", onConnect, onMessage }: ProfileCardProps) {
  const {
    id,
    name,
    avatar,
    university,
    major,
    studentType,
    interests,
    languages,
    bio,
    matchPercentage
  } = profile;
  
  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="relative">
        {/* Banner color based on student type */}
        <div 
          className={`h-20 w-full 
            ${studentType === "local" 
              ? "bg-gradient-to-r from-brand-purple to-indigo-500" 
              : "bg-gradient-to-r from-brand-pink to-pink-400"
            }`}
        />
        
        {/* Student type badge */}
        <Badge 
          className={`absolute top-3 right-3 
            ${studentType === "local"
              ? "bg-indigo-600" 
              : "bg-pink-500"
            }`}
        >
          {studentType === "local" ? "Local Student" : "International Student"}
        </Badge>
        
        {/* Match percentage if available */}
        {matchPercentage && (
          <div className="absolute top-14 right-3 bg-white rounded-full shadow-md h-14 w-14 flex items-center justify-center">
            <div className="text-center">
              <div className="font-semibold text-sm text-brand-purple">{matchPercentage}%</div>
              <div className="text-xs text-gray-500">Match</div>
            </div>
          </div>
        )}
        
        {/* Avatar */}
        <Avatar className="absolute -bottom-6 left-6 h-16 w-16 border-4 border-white">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
      </div>
      
      <CardContent className="pt-8 pb-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-sm text-gray-500">{university}</p>
            <p className="text-sm text-gray-500">{major}</p>
          </div>
          
          {variant === "full" && (
            <p className="text-sm text-gray-600 line-clamp-3">{bio}</p>
          )}
          
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {languages.slice(0, variant === "compact" ? 2 : languages.length).map(language => (
                <Badge key={language} variant="outline" className="bg-accent/50">
                  {language}
                </Badge>
              ))}
              {variant === "compact" && languages.length > 2 && (
                <Badge variant="outline" className="bg-accent/50">+{languages.length - 2}</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {interests.slice(0, variant === "compact" ? 3 : interests.length).map(interest => (
                <Badge key={interest} variant="secondary" className="bg-secondary/50">
                  {interest}
                </Badge>
              ))}
              {variant === "compact" && interests.length > 3 && (
                <Badge variant="secondary" className="bg-secondary/50">+{interests.length - 3}</Badge>
              )}
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 bg-brand-purple hover:bg-brand-dark"
              onClick={() => onConnect?.(id)}
            >
              <Users className="mr-2 h-4 w-4" />
              Connect
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onMessage?.(id)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 