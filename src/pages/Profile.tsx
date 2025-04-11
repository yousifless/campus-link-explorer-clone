
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageSquare, Share2, Calendar, MapPin, Briefcase, Book, Mail, Edit, User, Users, BookOpen } from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('posts');
  
  const profileData = {
    name: "Jane Doe",
    username: "janedoe",
    major: "Computer Science",
    year: "Junior",
    bio: "CS student passionate about web development and AI. Looking for study partners and project collaborators.",
    location: "University Campus, Building 5",
    email: "jane.doe@university.edu",
    joined: "September 2023",
    followers: 128,
    following: 75,
    courses: [
      { id: 1, code: "CS101", name: "Introduction to Programming" },
      { id: 2, code: "CS210", name: "Data Structures" },
      { id: 3, code: "CS310", name: "Algorithms" },
      { id: 4, code: "MATH240", name: "Linear Algebra" }
    ],
    skills: ["JavaScript", "React", "Python", "Java", "Machine Learning", "UI/UX Design"],
    posts: [
      {
        id: 1,
        content: "Just submitted my project for the hackathon! Fingers crossed 🤞",
        timestamp: "2 days ago",
        likes: 34,
        comments: 5
      },
      {
        id: 2,
        content: "Looking for study partners for the upcoming Algorithms exam. Anyone interested?",
        timestamp: "1 week ago",
        likes: 12,
        comments: 8
      }
    ],
    activities: [
      {
        id: 1,
        type: "event",
        title: "Campus Hackathon",
        date: "May 15-17, 2023",
        role: "Participant"
      },
      {
        id: 2,
        type: "club",
        title: "Coding Club",
        role: "Member",
        joined: "October 2023"
      },
      {
        id: 3,
        type: "project",
        title: "AI Study Assistant",
        role: "Developer",
        status: "In Progress"
      }
    ]
  };

  return (
    <div className="campus-container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src="/placeholder.svg" alt={profileData.name} />
                  <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{profileData.name}</h2>
                <p className="text-gray-600">@{profileData.username}</p>
                <div className="flex items-center mt-1">
                  <Badge variant="secondary" className="mr-2">
                    {profileData.major}
                  </Badge>
                  <Badge variant="outline">{profileData.year}</Badge>
                </div>
                
                <div className="mt-4 w-full">
                  <Button className="w-full">Edit Profile</Button>
                </div>
                
                <div className="flex justify-between w-full mt-6 pt-4 border-t">
                  <div className="text-center">
                    <p className="font-bold">{profileData.followers}</p>
                    <p className="text-sm text-gray-600">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{profileData.following}</p>
                    <p className="text-sm text-gray-600">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{profileData.posts.length}</p>
                    <p className="text-sm text-gray-600">Posts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* About Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{profileData.bio}</p>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-sm">{profileData.location}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">{profileData.email}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">Joined {profileData.joined}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Courses Card */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Current Courses</CardTitle>
              <Link to="/courses" className="text-xs text-campus-blue hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {profileData.courses.map(course => (
                  <li key={course.id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <BookOpen className="h-4 w-4 text-campus-blue" />
                    </div>
                    <div>
                      <p className="font-medium">{course.code}</p>
                      <p className="text-xs text-gray-600">{course.name}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          {/* Skills Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="posts" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-6 mt-6">
              {profileData.posts.map(post => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg" alt={profileData.name} />
                        <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{profileData.name}</h3>
                        <p className="text-sm text-gray-500">{post.timestamp}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-gray-800">{post.content}</p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-3 border-t">
                      <div className="flex space-x-6">
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-6 mt-6">
              {profileData.activities.map(activity => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="mr-4">
                        {activity.type === 'event' && (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-campus-blue" />
                          </div>
                        )}
                        {activity.type === 'club' && (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-campus-blue" />
                          </div>
                        )}
                        {activity.type === 'project' && (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Book className="h-5 w-5 text-campus-blue" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-semibold">{activity.title}</h3>
                          <Badge variant="outline">{activity.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Role: {activity.role}</p>
                        {activity.date && <p className="text-sm text-gray-600">{activity.date}</p>}
                        {activity.joined && <p className="text-sm text-gray-600">Joined: {activity.joined}</p>}
                        {activity.status && <p className="text-sm text-gray-600">Status: {activity.status}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            {/* About Tab (Mobile) */}
            <TabsContent value="about" className="space-y-6 mt-6 lg:hidden">
              <Card>
                <CardHeader>
                  <CardTitle>Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{profileData.bio}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{profileData.location}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{profileData.email}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {profileData.courses.map(course => (
                      <li key={course.id}>
                        <strong>{course.code}:</strong> {course.name}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
