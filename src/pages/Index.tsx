
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Users, MessageSquare, Globe, School, BookOpen, UserCheck } from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900">
            Connect with Students in Japan
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-600">
            The easiest way for international and local students to make meaningful connections across universities in Japan.
          </p>
          {isAuthenticated ? (
            <Link to="/feed">
              <Button size="lg" className="font-medium text-lg px-8">
                Discover Students <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="font-medium text-lg w-full sm:w-auto px-8">
                  Get Started <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="font-medium text-lg w-full sm:w-auto px-8">
                  Log In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How CampusLink Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users size={32} className="text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Match With Students</h3>
              <p className="text-gray-600">
                Find students based on shared interests, languages, and fields of study with our smart matching algorithm.
              </p>
            </div>
            
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <MessageSquare size={32} className="text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Chat & Connect</h3>
              <p className="text-gray-600">
                Start conversations with your matches and schedule real-life coffee meetups.
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Globe size={32} className="text-purple-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Build Your Network</h3>
              <p className="text-gray-600">
                Expand your social circle and cultural understanding by meeting local and international students.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Who It's For</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="bg-orange-100 p-3 rounded-full mr-4">
                  <Globe size={24} className="text-orange-600" />
                </div>
                <h3 className="text-xl font-bold">International Students</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <UserCheck size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Connect with local students who can help you navigate Japanese culture</span>
                </li>
                <li className="flex items-start">
                  <UserCheck size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Practice your Japanese with native speakers</span>
                </li>
                <li className="flex items-start">
                  <UserCheck size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Find friends who share your interests and academic goals</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <School size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Local Japanese Students</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <UserCheck size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Meet students from all over the world right on your campus</span>
                </li>
                <li className="flex items-start">
                  <UserCheck size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Practice foreign languages with native speakers</span>
                </li>
                <li className="flex items-start">
                  <UserCheck size={18} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>Gain international perspectives and build global friendships</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-500 to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Connect?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of students across Japan creating meaningful cross-cultural friendships.
          </p>
          {isAuthenticated ? (
            <Link to="/feed">
              <Button size="lg" variant="secondary" className="font-medium text-lg px-8">
                Discover Students <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          ) : (
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="font-medium text-lg px-8">
                Sign Up Now <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
