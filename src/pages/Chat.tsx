
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, MessageSquare } from 'lucide-react';
import { useConversation } from '@/contexts/ConversationContext';
import { ConversationType } from '@/types/database';
import { format, isToday, isYesterday } from 'date-fns';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { conversations, loading: loadingConversations } = useConversation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = searchTerm
    ? conversations.filter(conv => 
        conv.other_user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.other_user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  // Format date for last message
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'p'); // e.g. 12:00 PM
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d'); // e.g. Jan 1
    }
  };

  const handleConversationClick = (conversation: ConversationType) => {
    navigate(`/chat/${conversation.id}`);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search conversations"
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {loadingConversations ? (
        <div className="flex justify-center my-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center my-10">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          {searchTerm ? (
            <p className="text-gray-500">No conversations found matching "{searchTerm}"</p>
          ) : (
            <div>
              <p className="text-gray-500 mb-4">You don't have any messages yet.</p>
              <p className="text-gray-400 text-sm">
                Start conversations with your matches to see them here.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleConversationClick(conversation)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={conversation.other_user?.avatar_url || ''} alt={conversation.other_user?.first_name || 'User'} />
                    <AvatarFallback>
                      {conversation.other_user?.first_name?.[0]}{conversation.other_user?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium truncate">
                        {conversation.other_user?.first_name} {conversation.other_user?.last_name}
                      </h3>
                      {conversation.last_message && (
                        <span className="text-xs text-gray-500">
                          {formatMessageDate(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.last_message?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chat;
