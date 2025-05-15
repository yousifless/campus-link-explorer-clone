import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Users, Lightbulb } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ClubMessage } from '@/types/clubs';
import ClubMessageBubble from './ClubMessageBubble';
import ClubMessageInput from './ClubMessageInput';
import { getRandomIceBreakers } from '@/utils/iceBreakers';
import { Button } from '@/components/ui/button';

interface ClubChatWindowProps {
  clubName: string;
  messages: ClubMessage[];
  loading: boolean;
  onSend: (msg: string, mediaType?: string, mediaUrl?: string) => void;
  userId: string | null;
}

// Group messages by date
function groupMessagesByDate(messages: ClubMessage[]) {
  const groups: { [date: string]: ClubMessage[] } = {};
  messages.forEach(msg => {
    const date = format(parseISO(msg.created_at || ''), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  });
  return groups;
}

function ClubIceBreakers({ onSendIcebreaker }: { onSendIcebreaker: (text: string) => void }) {
  const [icebreakers] = useState(getRandomIceBreakers(3));
  
  return (
    <div className="flex flex-col gap-3 bg-indigo-50 p-4 my-4 rounded-lg border border-indigo-200 max-w-md mx-auto w-full">
      <div className="flex items-center gap-2 text-indigo-700">
        <Lightbulb className="h-5 w-5" />
        <h3 className="font-medium">Group Chat Starters</h3>
      </div>
      <div className="flex flex-col gap-2">
        {icebreakers.map((icebreaker, index) => (
          <Button
            key={index}
            variant="outline"
            className="justify-start text-left h-auto py-2 text-sm border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800"
            onClick={() => onSendIcebreaker(icebreaker)}
          >
            {icebreaker}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function ClubChatWindow({ clubName, messages, loading, onSend, userId }: ClubChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const grouped = groupMessagesByDate(messages);
  const sortedDates = Object.keys(grouped).sort();

  const handleSendMessage = (message: string, mediaType?: string, mediaUrl?: string) => {
    onSend(message, mediaType, mediaUrl);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FFFBF0] h-[600px] rounded-lg overflow-hidden">
      {/* Chat header */}
      <div className="p-4 border-b border-[#FACC15]/30 bg-[#FFFFFF] flex items-center gap-3">
        <div className="bg-[#A78BFA]/10 rounded-full p-2">
          <Users className="w-6 h-6 text-[#A78BFA]" />
        </div>
        <div>
          <div className="font-semibold text-[#1E293B]">
            {clubName} Chat
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[#A78BFA]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#64748B]">
            <span className="text-4xl mb-2">💬</span>
            <span className="font-medium">No messages yet</span>
            <span className="text-xs mt-1">Be the first to start a conversation!</span>
            <ClubIceBreakers onSendIcebreaker={onSend} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedDates.map(date => (
              <div key={date}>
                <div className="flex justify-center my-2">
                  <span className="text-xs bg-[#FACC15]/30 text-[#64748B] px-3 py-1 rounded-full shadow-sm">
                    {format(parseISO(date), 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex flex-col gap-y-2">
                  {grouped[date].map((msg, idx) => (
                    <ClubMessageBubble
                      key={msg.id}
                      content={msg.content}
                      isSent={msg.sender_id === userId}
                      timestamp={format(parseISO(msg.created_at || ''), 'HH:mm')}
                      showAvatar={
                        idx === 0 || grouped[date][idx - 1]?.sender_id !== msg.sender_id
                      }
                      avatarUrl={msg.sender?.avatar_url}
                      name={`${msg.sender?.first_name || ''} ${msg.sender?.last_name || ''}`}
                      mediaType={msg.media_type}
                      mediaUrl={msg.media_url}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="border-t border-[#FACC15]/30 bg-[#FFFFFF]">
        <ClubMessageInput onSend={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
} 