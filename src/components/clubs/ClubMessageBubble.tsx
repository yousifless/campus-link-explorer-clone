import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Play, Pause, Volume2 } from 'lucide-react';

interface ClubMessageBubbleProps {
  content: string;
  isSent: boolean;
  timestamp: string;
  showAvatar?: boolean;
  avatarUrl?: string | null;
  name?: string;
  mediaType?: string;
  mediaUrl?: string;
}

export default function ClubMessageBubble({
  content,
  isSent,
  timestamp,
  showAvatar = true,
  avatarUrl,
  name,
  mediaType,
  mediaUrl
}: ClubMessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const renderMedia = () => {
    if (!mediaType || !mediaUrl) return null;
    
    if (mediaType === 'image') {
      return (
        <img 
          src={mediaUrl} 
          alt="Message media" 
          className="max-w-full rounded-lg max-h-48 mb-2 object-contain bg-white shadow-sm"
        />
      );
    } else if (mediaType === 'audio') {
      return (
        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md mb-2">
          <button 
            onClick={toggleAudio}
            className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          <div className="flex flex-col flex-1">
            <div className="flex items-center">
              <Volume2 className="h-3 w-3 text-gray-400 mr-1" />
              <span className="text-xs text-gray-500">Voice message</span>
            </div>
          </div>
          
          <audio 
            ref={audioRef} 
            src={mediaUrl} 
            onEnded={handleAudioEnded}
            className="hidden" 
          />
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isSent && showAvatar && (
        <div className="mr-2 flex-shrink-0">
          <Avatar className="h-8 w-8 border border-[#FACC15]/40 shadow-sm">
            <AvatarImage src={avatarUrl || undefined} alt={name || 'User'} />
            <AvatarFallback className="text-xs">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className={`max-w-[75%] ${isSent ? 'ml-12' : 'mr-12'}`}>
        {!isSent && showAvatar && name && (
          <p className="text-xs text-gray-500 mb-1 ml-1">{name}</p>
        )}
        
        <div
          className={`rounded-2xl py-2 px-4 ${
            isSent
              ? 'bg-[#A78BFA] text-white'
              : 'bg-white border border-[#FACC15]/30 text-[#1E293B]'
          }`}
        >
          {renderMedia()}
          {content && <p className="whitespace-pre-wrap break-words">{content}</p>}
          <p
            className={`text-xs text-right mt-1 ${
              isSent ? 'text-indigo-100' : 'text-gray-400'
            }`}
          >
            {timestamp}
          </p>
        </div>
      </div>
    </div>
  );
} 