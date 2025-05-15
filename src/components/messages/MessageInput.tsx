import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Mic, X, Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { nanoid } from 'nanoid';

interface MessageInputProps {
  onSend: (message: string, mediaType?: string, mediaUrl?: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function MessageInput({ onSend, disabled, loading }: MessageInputProps) {
  const { user } = useAuth();
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle normal text message send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((disabled || loading || uploadingMedia) && !mediaFile) return;
    
    // If we have a media file, upload it
    if (mediaFile) {
      setUploadingMedia(true);
      try {
        const fileExt = mediaFile.name.split('.').pop();
        const mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'audio';
        const fileName = `${user?.id}/${nanoid()}.${fileExt}`;
        const filePath = `chat-media/${fileName}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, mediaFile);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('chat-media')
          .getPublicUrl(filePath);
        
        // Send message with media
        onSend(value, mediaType, publicUrlData.publicUrl);
        
        // Clear the input and media
        setValue('');
        setMediaFile(null);
        setMediaPreview(null);
      } catch (error) {
        console.error('Error uploading media:', error);
      } finally {
        setUploadingMedia(false);
      }
    } else if (value.trim()) {
      // Text-only message
      onSend(value);
      setValue('');
    }
  };
  
  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB for images)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }
    
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };
  
  // Handle voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.wav`, { type: 'audio/wav' });
        setMediaFile(audioFile);
        setMediaPreview(URL.createObjectURL(audioBlob));
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your browser permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop all tracks to release the microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const cancelMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };
  
  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="bg-[#FFFFFF] border-t border-[#FACC15]/30">
      {/* Media preview */}
      {mediaPreview && (
        <div className="p-2 border-b border-[#FACC15]/30 flex items-center justify-between">
          <div className="flex items-center">
            {mediaFile?.type.startsWith('image/') ? (
              <img src={mediaPreview} alt="Selected media" className="h-14 w-14 object-cover rounded" />
            ) : (
              <div className="h-8 bg-[#A78BFA]/10 px-3 py-1 rounded-full flex items-center text-[#A78BFA]">
                <Mic className="h-4 w-4 mr-1" />
                <span className="text-xs">Voice message ({formatTime(recordingTime)})</span>
              </div>
            )}
          </div>
          <button 
            type="button" 
            onClick={cancelMedia} 
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}
      
      {/* Input form */}
      <form onSubmit={handleSend} className="flex items-center gap-2 p-3">
        {/* Image upload button */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || loading || isRecording}
          className="text-[#A78BFA] hover:bg-[#A78BFA]/10 p-2 rounded-full transition-colors"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        
        {/* Voice message button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || loading || !!mediaFile}
          className={`p-2 rounded-full transition-colors ${
            isRecording ? 'bg-red-100 text-red-500' : 'text-[#A78BFA] hover:bg-[#A78BFA]/10'
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>
        
        {/* Text input */}
        <input
          type="text"
          className="flex-1 rounded-full px-4 py-2 bg-[#FFFBF0] border border-[#A78BFA]/20 focus:outline-none focus:ring-2 focus:ring-[#A78BFA] text-[#1E293B] placeholder-[#64748B] shadow-sm"
          placeholder={isRecording ? "Recording voice message..." : "Type a message... ✨"}
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={disabled || loading || isRecording}
          maxLength={500}
        />
        
        {/* Send button */}
        <button
          type="submit"
          className="rounded-full bg-[#A78BFA] hover:bg-[#FB7185] transition-colors text-white p-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={(disabled || loading || uploadingMedia || (!value.trim() && !mediaFile))}
          aria-label="Send message"
        >
          {uploadingMedia ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
} 