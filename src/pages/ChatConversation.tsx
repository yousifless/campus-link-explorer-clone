
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversation } from '@/contexts/ConversationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const ChatConversation = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    fetchMessages, 
    messages, 
    sendMessage, 
    loading, 
    conversations,
    fetchConversations,
    setCurrentConversation 
  } = useConversation();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchMessages(id);
    }
  }, [id, fetchMessages]);

  useEffect(() => {
    if (conversations.length === 0) {
      fetchConversations();
    } else {
      const conversation = conversations.find(c => c.id === id);
      if (conversation) {
        setCurrentConversation(conversation);
      }
    }

    return () => {
      setCurrentConversation(null);
    };
  }, [id, conversations, fetchConversations, setCurrentConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentConversation = conversations.find(c => c.id === id);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newMessage.trim()) return;
    
    await sendMessage(id, newMessage.trim());
    setNewMessage('');
  };

  if (!id) {
    return <div>Invalid conversation</div>;
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="bg-background border-b p-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
            <ArrowLeft size={20} />
          </Button>
          <Skeleton className="h-8 w-40 ml-4" />
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <Skeleton className="h-12 w-3/4 ml-auto" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-12 w-3/4 ml-auto" />
        </div>
        <div className="border-t p-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="bg-background border-b p-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
          <ArrowLeft size={20} />
        </Button>
        {currentConversation ? (
          <div className="flex items-center ml-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {currentConversation.otherUser.avatar_url ? (
                <img
                  src={currentConversation.otherUser.avatar_url}
                  alt={`${currentConversation.otherUser.first_name} ${currentConversation.otherUser.last_name}`}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User size={20} className="text-primary" />
              )}
            </div>
            <div className="ml-3">
              <h3 className="font-medium">
                {currentConversation.otherUser.first_name} {currentConversation.otherUser.last_name}
              </h3>
            </div>
          </div>
        ) : (
          <div className="ml-2">Loading...</div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4">
            <div className="text-muted-foreground">
              <p className="mb-2 font-medium">No messages yet</p>
              <p>Start the conversation by saying hello!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isCurrentUser = message.sender_id === user?.id;
              
              return (
                <div 
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      isCurrentUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <p>{message.content}</p>
                    <div 
                      className={`text-xs mt-1 ${
                        isCurrentUser 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim() || loading}>
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatConversation;
