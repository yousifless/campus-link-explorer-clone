import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { MessageType } from '@/types/database';

const ChatTest = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [directMessage, setDirectMessage] = useState(''); // For emergency send
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Reset loading state on mount to prevent stuck loading
  useEffect(() => {
    // Force reset loading state after a timeout
    const timer = setTimeout(() => {
      if (loading) {
        console.log('Forcing loading state reset');
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [loading]);

  // Clear any errors on mount
  useEffect(() => {
    setError(null);
  }, []);

  // Fetch conversation ID from match ID
  useEffect(() => {
    const fetchConversation = async () => {
      if (!id || !user) return;
      
      try {
        console.log('Fetching conversation for match ID:', id);
        
        // First check if a conversation exists for this match
        const { data: conversations, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('match_id', id);
          
        if (convError) {
          console.error('Error fetching conversations:', convError);
          setError('Failed to fetch conversation');
          return;
        }
        
        if (conversations && conversations.length > 0) {
          console.log('Found existing conversation:', conversations[0]);
          setConversationId(conversations[0].id);
        } else {
          // Create a new conversation if none exists
          console.log('Creating new conversation for match ID:', id);
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert([
              {
                match_id: id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating conversation:', createError);
            setError('Failed to create conversation');
            return;
          }
          
          console.log('Created new conversation:', newConv);
          setConversationId(newConv.id);
        }
      } catch (err) {
        console.error('Error in fetchConversation:', err);
        setError('An unexpected error occurred');
      }
    };
    
    fetchConversation();
  }, [id, user]);

  // Fetch messages when conversation ID changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        setError(null);

        // First get the conversation ID from the match ID
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select('id')
          .eq('match_id', id)
          .single();

        if (conversationError) throw conversationError;
        if (!conversationData) {
          setError('Conversation not found');
          return;
        }

        setConversationId(conversationData.id);

        // Then fetch messages for this conversation
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('id, conversation_id, sender_id, content, created_at, is_read')
          .eq('conversation_id', conversationData.id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        if (messagesData && messagesData.length > 0) {
          // Get unique sender IDs
          const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];

          // Fetch profiles for all senders
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', senderIds);

          if (profilesError) throw profilesError;

          // Create a map of profiles
          const profilesMap = new Map(
            profilesData?.map(profile => [profile.id, profile]) || []
          );

          // Combine messages with sender profiles
          const messagesWithProfiles = messagesData.map(msg => ({
            ...msg,
            sender: {
              first_name: profilesMap.get(msg.sender_id)?.first_name || null,
              last_name: profilesMap.get(msg.sender_id)?.last_name || null,
              avatar_url: profilesMap.get(msg.sender_id)?.avatar_url || null
            }
          }));

          setMessages(messagesWithProfiles);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [id, user]);

  // Simplified send function
  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      console.log("Message is empty, not sending");
      return;
    }
    
    console.log("Attempting to send message:", newMessage);
    
    try {
      setSending(true);
      
      // Direct database insert
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId || '6a18899d-8211-4fdd-ac7a-dbf2a28c74f0', // Use conversationId or fallback
          sender_id: user?.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          is_read: false
        }])
        .select();
        
      if (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
      } else {
        console.log("Message sent successfully:", data);
        setNewMessage('');
        // Force refresh messages
        const { data: messagesData } = await supabase
          .from('messages')
          .select('id, conversation_id, sender_id, content, created_at, is_read')
          .eq('conversation_id', conversationId || '6a18899d-8211-4fdd-ac7a-dbf2a28c74f0')
          .order('created_at', { ascending: true });
          
        if (messagesData) {
          setMessages(messagesData as MessageType[]);
        }
      }
    } catch (err: any) {
      console.error("Send exception:", err);
      alert("Exception: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // Debug button state
  console.log("BUTTON STATE:", {
    messageEmpty: !newMessage.trim(),
    isLoading: loading,
    isSending: sending,
    hasError: !!error,
    newMessageValue: newMessage,
    conversationId: conversationId,
    userId: user?.id
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="bg-background border-b p-4">
        <h1 className="text-xl font-bold">Chat Test Component</h1>
        <p>Match ID: {id}</p>
        <p>Conversation ID: {conversationId || 'Loading...'}</p>
        {error && <p className="text-red-500">{error}</p>}
      </div>
      
      {/* Debug Info */}
      <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', fontSize: '12px'}}>
        <h4>Debug Info</h4>
        <p>User ID: {user?.id || 'Not logged in'}</p>
        <p>Match ID: {id}</p>
        <p>Conversation ID: {conversationId || '6a18899d-8211-4fdd-ac7a-dbf2a28c74f0'}</p>
        <button onClick={() => console.log("Current user:", user)}>Log User</button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <div 
                key={message.id}
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.sender_id === user?.id 
                    ? 'bg-blue-500 text-white ml-auto' 
                    : 'bg-gray-200'
                }`}
              >
                <p className="font-bold">
                  {message.sender?.first_name || 'Unknown'}:
                </p>
                <p>{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        {/* Direct Send Form - Bypasses the disabled state */}
        <div className="mb-4 p-3 border border-green-500 rounded">
          <h4 className="text-green-600 font-bold">Direct Send (Always Enabled)</h4>
          <div className="flex space-x-2 mt-2">
            <Input
              value={newMessage}
              onChange={(e) => {
                console.log("Input changed:", e.target.value);
                setNewMessage(e.target.value);
              }}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button 
              type="button"
              onClick={() => {
                console.log("Direct send button clicked");
                handleSendMessage();
              }}
              className="bg-green-500 hover:bg-green-600"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
        
        {/* Original Form - May have disabled button issues */}
        <form 
          className="flex space-x-2"
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Form submitted with message:", newMessage);
            
            // Call send function directly
            handleSendMessage();
          }}
        >
          <Input
            value={newMessage}
            onChange={(e) => {
              console.log("Input changed:", e.target.value);
              setNewMessage(e.target.value);
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending || loading}
            onClick={() => console.log('Send button clicked')}
          >
            <Send size={18} />
          </Button>
        </form>
        
        {/* Emergency Direct Send Button */}
        <div style={{marginTop: '10px', padding: '10px', border: '1px solid red'}}>
          <h4>Emergency Send</h4>
          <div className="flex space-x-2">
            <Input
              value={directMessage} 
              onChange={(e) => setDirectMessage(e.target.value)} 
              placeholder="Type message here"
            />
            <Button
              onClick={async () => {
                if (!directMessage.trim()) {
                  alert("Please enter a message");
                  return;
                }
                
                try {
                  // Direct database insert
                  const { data, error } = await supabase
                    .from('messages')
                    .insert([{
                      conversation_id: conversationId || '6a18899d-8211-4fdd-ac7a-dbf2a28c74f0', // Use conversationId or fallback
                      sender_id: user?.id, // Make sure user is available
                      content: directMessage,
                      created_at: new Date().toISOString(),
                      is_read: false
                    }])
                    .select();
                    
                  if (error) {
                    alert("Error: " + error.message);
                    console.error("Send error:", error);
                  } else {
                    alert("Message sent successfully!");
                    setDirectMessage('');
                    // Force refresh messages
                    const { data: messagesData } = await supabase
                      .from('messages')
                      .select('id, conversation_id, sender_id, content, created_at, is_read')
                      .eq('conversation_id', conversationId || '6a18899d-8211-4fdd-ac7a-dbf2a28c74f0')
                      .order('created_at', { ascending: true });
                      
                    if (messagesData) {
                      setMessages(messagesData as MessageType[]);
                    }
                  }
                } catch (err: any) {
                  alert("Exception: " + err.message);
                  console.error("Send exception:", err);
                }
              }}
            >
              Emergency Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTest; 