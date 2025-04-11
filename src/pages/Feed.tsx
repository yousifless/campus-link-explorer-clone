
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ThumbsUp, MessageSquare, Share2, Bookmark, MoreHorizontal, Image, 
  Link as LinkIcon, Smile, Calendar, Users, BookOpen, TrendingUp
} from 'lucide-react';

const Feed = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: "Alex Johnson",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        role: "Computer Science Student"
      },
      content: "Just finished my research project on AI applications in healthcare. Looking for feedback from anyone in the CS or medical fields!",
      timestamp: "2 hours ago",
      likes: 24,
      comments: 8,
      isLiked: false,
      isBookmarked: false
    },
    {
      id: 2,
      author: {
        name: "Professor Williams",
        avatar: "https://randomuser.me/api/portraits/women/68.jpg",
        role: "Faculty, Department of Physics"
      },
      content: "Reminder: The deadline for the summer research program application is next Friday. Feel free to reach out if you have any questions about the application process.",
      timestamp: "5 hours ago",
      likes: 45,
      comments: 12,
      isLiked: true,
      isBookmarked: true
    },
    {
      id: 3,
      author: {
        name: "Student Government",
        avatar: "https://randomuser.me/api/portraits/lego/5.jpg",
        role: "Official Account"
      },
      content: "We're excited to announce the Spring Festival will be held on May 15th in the main quad! There will be food, music, and activities for all students. Don't miss out!",
      timestamp: "1 day ago",
      likes: 112,
      comments: 34,
      isLiked: false,
      isBookmarked: false
    }
  ]);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleBookmark = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isBookmarked: !post.isBookmarked
        };
      }
      return post;
    }));
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    
    const newPost = {
      id: posts.length + 1,
      author: {
        name: "You",
        avatar: "/placeholder.svg",
        role: "Student"
      },
      content: newPostContent,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      isLiked: false,
      isBookmarked: false
    };
    
    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  return (
    <div className="campus-container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src="/placeholder.svg" alt="Profile" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">Jane Doe</h2>
                <p className="text-sm text-gray-600">Computer Science, Junior</p>
              </div>
              
              <div className="space-y-5">
                <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-campus-blue">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="Profile" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <span>My Profile</span>
                </Link>
                
                <Link to="/events" className="flex items-center space-x-2 text-gray-700 hover:text-campus-blue">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-campus-blue" />
                  </div>
                  <span>Events</span>
                </Link>
                
                <Link to="/groups" className="flex items-center space-x-2 text-gray-700 hover:text-campus-blue">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-campus-blue" />
                  </div>
                  <span>Groups</span>
                </Link>
                
                <Link to="/courses" className="flex items-center space-x-2 text-gray-700 hover:text-campus-blue">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-campus-blue" />
                  </div>
                  <span>Courses</span>
                </Link>
                
                <Link to="/resources" className="flex items-center space-x-2 text-gray-700 hover:text-campus-blue">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-campus-blue" />
                  </div>
                  <span>Resources</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Create Post */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handlePostSubmit}>
                <div className="flex space-x-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt="Profile" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <Input
                      placeholder="What's on your mind?"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between mt-4 pt-3 border-t">
                  <div className="flex space-x-4">
                    <Button type="button" variant="ghost" size="sm" className="text-gray-600">
                      <Image className="mr-2 h-4 w-4" /> Photo
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-gray-600">
                      <LinkIcon className="mr-2 h-4 w-4" /> Link
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-gray-600">
                      <Smile className="mr-2 h-4 w-4" /> Feeling
                    </Button>
                  </div>
                  <Button type="submit" size="sm" disabled={!newPostContent.trim()}>
                    Post
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Feed Tabs */}
          <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-sm">All Posts</TabsTrigger>
              <TabsTrigger value="trending" className="text-sm">Trending</TabsTrigger>
              <TabsTrigger value="following" className="text-sm">Following</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Posts Feed */}
          {activeTab === "all" && (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex space-x-3">
                          <Avatar>
                            <AvatarImage src={post.author.avatar} alt={post.author.name} />
                            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{post.author.name}</h3>
                            <p className="text-sm text-gray-500">{post.author.role} • {post.timestamp}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5 text-gray-500" />
                        </Button>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-3 border-t">
                        <div className="flex space-x-6">
                          <button 
                            className={`flex items-center space-x-1 ${post.isLiked ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500`}
                            onClick={() => handleLike(post.id)}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-sm">{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm">{post.comments}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                        <button 
                          className={`${post.isBookmarked ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500`}
                          onClick={() => handleBookmark(post.id)}
                        >
                          <Bookmark className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {activeTab === "trending" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-campus-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Trending Coming Soon</h3>
              <p className="text-gray-500 text-center max-w-md">
                We're working on bringing you the most popular content from across campus.
              </p>
            </div>
          )}
          
          {activeTab === "following" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-campus-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Follow Some Users</h3>
              <p className="text-gray-500 text-center max-w-md">
                Start following other users to see their posts in your Following feed.
              </p>
              <Button className="mt-4">Discover People</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
