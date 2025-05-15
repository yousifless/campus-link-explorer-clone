import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { UserProfile, Conversation, Message } from '@/pages/MessagesPage';
import { Loader2, Lightbulb } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { getRandomIceBreakers } from '@/utils/iceBreakers';
import { Button } from '@/components/ui/button';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  onSend: (msg: string, mediaType?: string, mediaUrl?: string) => void;
  userId: string | null;
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { [date: string]: Message[] } = {};
  messages.forEach(msg => {
    const date = format(parseISO(msg.created_at), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  });
  return groups;
}

function IceBreakers({ onSendIcebreaker }: { onSendIcebreaker: (text: string) => void }) {
  const [icebreakers] = useState(getRandomIceBreakers(3));
  
  return (
    <div className="flex flex-col gap-3 bg-indigo-50 p-4 my-4 rounded-lg border border-indigo-200">
      <div className="flex items-center gap-2 text-indigo-700">
        <Lightbulb className="h-5 w-5" />
        <h3 className="font-medium">Conversation Starters</h3>
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

export default function ChatWindow({ conversation, messages, loading, onSend, userId }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#FFFBF0] text-[#64748B]">
        <span className="text-5xl mb-2">✨</span>
        <span className="font-semibold text-lg">Select a chat to start messaging</span>
        <span className="text-xs mt-1">Your conversations will appear here.</span>
      </div>
    );
  }

  const grouped = groupMessagesByDate(messages);
  const sortedDates = Object.keys(grouped).sort();

  const handleSendMessage = (message: string, mediaType?: string, mediaUrl?: string) => {
    onSend(message, mediaType, mediaUrl);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FFFBF0]">
      {/* Chat header */}
      <div className="p-4 border-b border-[#FACC15]/30 bg-[#FFFFFF] flex items-center gap-3">
        <img
          src={conversation.other_user.avatar_url || '/default-avatar.png'}
          alt={conversation.other_user.first_name}
          className="w-10 h-10 rounded-full border border-[#FACC15]/40 shadow-sm"
        />
        <div>
          <div className="font-semibold text-[#1E293B]">
            {conversation.other_user.first_name} {conversation.other_user.last_name}
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
            <span className="text-xs mt-1">Say hello and start the conversation!</span>
            <IceBreakers onSendIcebreaker={onSend} />
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
                    <MessageBubble
                      key={msg.id}
                      content={msg.content}
                      isSent={msg.sender_id === userId}
                      timestamp={format(parseISO(msg.created_at), 'HH:mm')}
                      showAvatar={
                        idx === 0 || grouped[date][idx - 1]?.sender_id !== msg.sender_id
                      }
                      avatarUrl={msg.sender.avatar_url}
                      name={msg.sender.first_name}
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
        <MessageInput onSend={handleSendMessage} disabled={loading} />
      </div>
    </div>
  );
} 