import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConversations } from '@/contexts/ConversationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import ChatWindow from '../components/messages/ChatWindow';

const DirectChat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { getMessages, sendMessage } = useConversations();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;
      setLoading(true);
      const fetchedMessages = await getMessages(conversationId);
      setMessages(fetchedMessages || []);
      setLoading(false);
    };

    fetchMessages();
  }, [conversationId, getMessages]);

  const handleSendMessage = async () => {
    if (!conversationId || !newMessage.trim()) return;
    const sentMessage = await sendMessage(conversationId, newMessage);
    if (sentMessage) {
      setMessages(prevMessages => [...prevMessages, sentMessage]);
      setNewMessage('');
    }
  };

  return (
    <div className="container mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Direct Chat</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading messages...</div>
          ) : (
            <ChatWindow messages={messages} currentUserId={user?.id} />
          )}
          <div className="flex items-center mt-4">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow mr-2"
            />
            <Button onClick={handleSendMessage}>
              Send <Send className="ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectChat;
