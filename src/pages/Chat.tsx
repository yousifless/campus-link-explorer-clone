
import React, { useEffect } from 'react';
import { useConversation } from '@/contexts/ConversationContext';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';

const Chat = () => {
  const { conversations, fetchConversations, loading } = useConversation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Messages</h2>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Messages</h2>
      
      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
          <p className="text-muted-foreground mb-4">
            Once you connect with other students, your conversations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Card 
              key={conversation.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleConversationClick(conversation.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {conversation.otherUser.avatar_url ? (
                      <img
                        src={conversation.otherUser.avatar_url}
                        alt={`${conversation.otherUser.first_name} ${conversation.otherUser.last_name}`}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={24} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium truncate">
                        {conversation.otherUser.first_name} {conversation.otherUser.last_name}
                      </h3>
                      {conversation.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message
                        ? conversation.last_message.content
                        : "No messages yet"}
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
