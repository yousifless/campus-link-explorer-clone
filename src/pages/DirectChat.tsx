
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversation } from '@/contexts/ConversationContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderIcon, Send, ArrowLeft, Info, Calendar, Video, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ScheduleMeetupButton } from '@/components/meetups/ScheduleMeetupButton';

// Find the locations where CSS properties are causing type errors and fix them:
// Line 264: overflowY should be typed as 'auto' | 'hidden' | 'scroll' etc.
// Line 266, 268: textAlign should be typed as 'left' | 'right' | 'center' etc.

// Example fix:
const chatContainerStyle: React.CSSProperties = {
  height: '400px',
  overflowY: 'auto' as 'auto', // Fix: use specific value instead of generic string
  padding: '16px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  marginBottom: '16px',
  border: '1px solid #e2e8f0'
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center' as 'center', // Fix: use specific value instead of generic string
  padding: '20px'
};

const loadingStateStyle: React.CSSProperties = {
  textAlign: 'center' as 'center', // Fix: use specific value instead of generic string
  padding: '20px',
  color: '#718096'
};

const messagesContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as 'column' // Fix: explicitly type as 'column'
};

const DirectChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getConversation, sendMessage, loadMessages, loading } = useConversation();
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [showMeetupButton, setShowMeetupButton] = useState(true);

  useEffect(() => {
    if (id) {
      fetchConversation();
      fetchMessages();
    }
  }, [id]);

  const fetchConversation = async () => {
    if (!id) return;
    
    try {
      const conv = await getConversation(id);
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

      <Card>
        <CardHeader className="border-b flex-row items-center justify-between space-y-0 p-4">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.first_name} />
              <AvatarFallback>{otherUser?.first_name?.charAt(0)}{otherUser?.last_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg">{otherUser?.first_name} {otherUser?.last_name}</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {showMeetupButton && (
              <ScheduleMeetupButton 
                matchId={id || ''} 
                matchedUser={otherUser || {}} 
                onScheduled={() => setShowMeetupButton(false)}
              />
            )}
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div style={chatContainerStyle}>
            {messages.length === 0 ? (
              <div style={emptyStateStyle}>
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div style={messagesContainerStyle}>
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`max-w-[75%] rounded-lg px-4 py-2 mb-2 ${
                      msg.sender_id === conversation.other_user.id 
                        ? 'bg-muted self-start' 
                        : 'bg-primary text-primary-foreground self-end'
                    }`}
                  >
                    <div>{msg.content}</div>
                    <div className={`text-xs mt-1 ${
                      msg.sender_id === conversation.other_user.id 
                        ? 'text-muted-foreground' 
                        : 'text-primary-foreground/80'
                    }`}>
                      {formatMessageDate(msg.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <form onSubmit={handleSend} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={!message.trim() || sending}>
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
