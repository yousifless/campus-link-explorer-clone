
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useConversations } from '@/contexts/ConversationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Users, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { conversations, loading } = useConversations();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  
  useEffect(() => {
    if (!conversations) return;
    
    const filtered = conversations.filter(conv => {
      const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
      // Here, ideally we would search by the other user's name, but we need to fetch that data
      return otherUserId.toLowerCase().includes(searchTerm.toLowerCase());
    });
    
    setFilteredConversations(filtered);
  }, [searchTerm, conversations, user]);
  
  const handleConversationClick = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[80vh]">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/10 border-0 text-white placeholder-white/70 focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="all" className="mt-2">
        <div className="px-4">
          <TabsList className="w-full grid grid-cols-3 bg-gray-100/80 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-white">
              <Users className="h-4 w-4 mr-1" />
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-white">
              <MessageSquare className="h-4 w-4 mr-1" />
              Unread
            </TabsTrigger>
            <TabsTrigger value="starred" className="data-[state=active]:bg-white">
              <Star className="h-4 w-4 mr-1" />
              Starred
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="mt-2 px-4 pb-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-3 rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filteredConversations.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-1"
            >
              {filteredConversations.map((conversation) => {
                const otherUserId = conversation.user1_id === user?.id ? conversation.user2_id : conversation.user1_id;
                const formattedTime = formatDistanceToNow(new Date(conversation.updated_at || conversation.created_at), { addSuffix: true });
                
                // We don't have all the details about the other user, so we show a placeholder
                return (
                  <motion.div 
                    key={conversation.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(0,0,0,0.02)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleConversationClick(conversation.id)}
                    className="flex items-center p-3 rounded-lg cursor-pointer border border-gray-100 bg-white shadow-sm"
                  >
                    <Avatar className="h-12 w-12 mr-4 border border-gray-200">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white">
                        {otherUserId.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900 truncate">User {otherUserId.substring(0, 5)}</h3>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          {formattedTime}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">Start a conversation...</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="bg-purple-100 p-4 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">No conversations yet</h3>
              <p className="text-gray-500 mb-4">Connect with other students to start chatting!</p>
              <Button 
                onClick={() => navigate('/matches')}
                className="bg-gradient-to-r from-violet-500 to-purple-600"
              >
                <Users className="h-4 w-4 mr-2" />
                Find Connections
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0 px-4 pb-4">
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-1">No unread messages</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        </TabsContent>
        
        <TabsContent value="starred" className="mt-0 px-4 pb-4">
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-amber-100 p-4 rounded-full mb-4">
              <Star className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-1">No starred conversations</h3>
            <p className="text-gray-500 mb-4">Star important conversations to find them easily</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessagesPage;
