import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { notifyNewMessage } from '@/utils/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

const DirectChat = () => {
  const { id: matchId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  
  // Get current user
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Load conversation and messages
  useEffect(() => {
    if (!user || !matchId) return;
    
    const loadConversationAndMessages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get match details to find the other user
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single();
          
        if (matchError) throw matchError;
        
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        
        // Get other user's profile
        const { data: otherUserProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();
          
        if (profileError) throw profileError;
        setOtherUser(otherUserProfile);
        
        // Get conversation
        const { data: conversations, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('match_id', matchId)
          .single();
          
        if (convError && convError.code !== 'PGRST116') throw convError;
        
        let currentConversationId = conversations?.id;
        
        if (!conversations) {
          // Create a new conversation
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert([{
              match_id: matchId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();
            
          if (createError) throw createError;
          currentConversationId = newConv.id;
        }
        
        setConversationId(currentConversationId);
        
        // Get messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .order('created_at', { ascending: true });
          
        if (messagesError) throw messagesError;
        setMessages(messagesData || []);
        
      } catch (err) {
        console.error('Error in loadConversationAndMessages:', err);
        setError('Failed to load chat. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load chat. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadConversationAndMessages();
  }, [user, matchId, toast]);
  
  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !conversationId) return;
    
    try {
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          is_read: false
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // Notify the other user
      if (otherUser) {
        await notifyNewMessage(
          otherUser.id,
          user.id,
          `${user.user_metadata.first_name} ${user.user_metadata.last_name}`,
          newMessage.trim(),
          user.user_metadata.avatar_url
        );
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Simple styles
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
    },
    backButton: {
      marginRight: '15px',
      padding: '8px 15px',
      background: '#f0f0f0',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    messagesContainer: {
      height: '400px',
      overflowY: 'auto',
      padding: '15px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '15px',
      border: '1px solid #ddd',
    },
    messagesList: {
      display: 'flex',
      flexDirection: 'column',
    },
    message: (isSent: boolean) => ({
      maxWidth: '70%',
      padding: '10px 15px',
      marginBottom: '10px',
      borderRadius: '18px',
      alignSelf: isSent ? 'flex-end' : 'flex-start',
      backgroundColor: isSent ? '#dcf8c6' : 'white',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    }),
    messageContent: {
      fontSize: '16px',
    },
    messageTime: {
      fontSize: '11px',
      color: '#999',
      textAlign: 'right',
      marginTop: '4px',
    },
    form: {
      display: 'flex',
      marginTop: '10px',
    },
    input: {
      flex: 1,
      padding: '10px 15px',
      borderRadius: '20px',
      border: '1px solid #ddd',
      outline: 'none',
    },
    sendButton: {
      marginLeft: '10px',
      padding: '10px 20px',
      backgroundColor: '#4caf50',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
    },
    loading: {
      textAlign: 'center',
      padding: '20px',
    },
    emptyMessages: {
      textAlign: 'center',
      padding: '20px',
      color: '#888',
    },
    error: {
      color: 'red',
      marginBottom: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/chat')}
        >
          &larr; Back
        </button>
        <h2>Direct Chat</h2>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.messagesContainer}>
        {loading ? (
          <div style={styles.loading}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyMessages}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div style={styles.messagesList}>
            {messages.map(message => (
              <div 
                key={message.id}
                style={styles.message(message.sender_id === user?.id)}
              >
                <div style={styles.messageContent}>{message.content}</div>
                <div style={styles.messageTime}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form style={styles.form} onSubmit={sendMessage}>
        <input
          style={styles.input}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button 
          style={styles.sendButton}
          type="submit"
          disabled={!newMessage.trim() || loading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default DirectChat; 