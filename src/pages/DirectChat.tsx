import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useConversations } from '@/contexts/ConversationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderIcon, Send, ArrowLeft, Info, Calendar, Video, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import ScheduleMeetupButton from '@/components/meetups/ScheduleMeetupButton';
import ChatIcebreaker from '@/components/icebreaker/ChatIcebreaker';

// Fix type issues with CSS properties
const chatContainerStyle: React.CSSProperties = {
  height: '400px',
  overflowY: 'auto' as 'auto',
  padding: '16px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  marginBottom: '16px',
  border: '1px solid #e2e8f0'
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center' as 'center',
  padding: '20px'
};

const loadingStateStyle: React.CSSProperties = {
  textAlign: 'center' as 'center',
  padding: '20px',
  color: '#718096'
};

const messagesContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as 'column'
};

const DirectChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getConversations, sendMessage, loadMessages, loading } = useConversations();
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [showMeetupButton, setShowMeetupButton] = useState(true);
  const messageInputRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchConversation();
      fetchMessages();
    }
  }, [id]);

  const fetchConversation = async () => {
    if (!id) return;
    
    try {
      const conv = await getConversations(id);
      setConversation(conv);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;
    
    try {
      const msgs = await loadMessages(id);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !id) return;
    
    setSending(true);
    
    try {
      const newMessage = await sendMessage({
        conversationId: id,
        content: message
      });
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };
  
  // Format date from ISO string
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'p'); // p = localized time format
  };

  const goBack = () => {
    navigate('/chat');
  };

  if (loading) {
    return (
      <div style={loadingStateStyle}>
        <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div style={emptyStateStyle}>
        <p>Conversation not found</p>
        <Button onClick={goBack} variant="link">Go back to all conversations</Button>
      </div>
    );
  }

  const otherUser = conversation.other_user;
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={goBack}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to all messages
      </Button>

      <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b flex-row items-center justify-between space-y-0 p-4 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.first_name} />
              <AvatarFallback className="bg-indigo-200 text-indigo-800">{otherUser?.first_name?.charAt(0)}{otherUser?.last_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg text-white">{otherUser?.first_name} {otherUser?.last_name}</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {showMeetupButton && (
              <ScheduleMeetupButton 
                matchId={id || ''} 
                matchedUser={otherUser || {}} 
                onScheduled={() => setShowMeetupButton(false)}
                onClick={() => {/* Add your meetup scheduling logic here */}}
              />
            )}
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {conversation && messages.length === 0 && (
            <ChatIcebreaker 
              userA={user}
              userB={conversation.other_user}
              matchId={id}
            />
          )}
          
          <div style={chatContainerStyle} className="bg-gradient-to-b from-gray-50 to-white shadow-inner">
            {messages.length === 0 ? (
              <div style={emptyStateStyle}>
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div style={messagesContainerStyle}>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`max-w-[75%] rounded-lg px-4 py-2 mb-2 ${
                      msg.sender_id === conversation.other_user.id 
                        ? 'bg-gray-100 text-gray-800 self-start' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white self-end'
                    }`}
                  >
                    <div>{msg.content}</div>
                    <div className={`text-xs mt-1 ${
                      msg.sender_id === conversation.other_user.id 
                        ? 'text-gray-500' 
                        : 'text-blue-100'
                    }`}>
                      {formatMessageDate(msg.created_at)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          <form onSubmit={handleSend} className="p-4 border-t bg-gradient-to-b from-white to-gray-50">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 bg-white border-gray-200 focus:border-blue-400 transition-all"
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || sending}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {sending ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectChat;
