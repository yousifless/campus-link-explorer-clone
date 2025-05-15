import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Conversation } from '@/pages/MessagesPage';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId?: string;
  onSelect: (conv: Conversation) => void;
}

export default function ConversationList({ conversations, loading, selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[#FACC15]/30 flex items-center gap-2 bg-[#FFFBF0]">
        <Sparkles className="text-[#A78BFA] w-5 h-5" />
        <span className="font-semibold text-[#1E293B] text-lg">Chats</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#64748B]">
            <span className="text-4xl mb-2 animate-bounce">💬</span>
            <span className="font-medium">Loading conversations...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#64748B]">
            <span className="text-4xl mb-2">💬</span>
            <span className="font-medium">No conversations yet</span>
            <span className="text-xs mt-1">Start a new chat to connect with friends!</span>
          </div>
        ) : (
          <ul className="divide-y divide-[#FACC15]/20">
            {conversations.map(conv => (
              <li key={conv.id}>
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors rounded-lg ${selectedId === conv.id ? 'bg-[#A78BFA]/10' : 'hover:bg-[#FACC15]/10'}`}
                  onClick={() => onSelect(conv)}
                >
                  <img
                    src={conv.other_user.avatar_url || '/default-avatar.png'}
                    alt={conv.other_user.first_name}
                    className="w-10 h-10 rounded-full border border-[#FACC15]/40 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1E293B] truncate">
                      {conv.other_user.first_name} {conv.other_user.last_name}
                    </div>
                    <div className="text-xs text-[#64748B] truncate">
                      {conv.last_message}
                    </div>
                  </div>
                  <span className="text-xs text-[#FB7185] font-semibold ml-2 shrink-0">
                    {conv.last_message_time}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 