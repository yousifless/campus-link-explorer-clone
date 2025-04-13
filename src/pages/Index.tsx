
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowRight, 
  Users, 
  MessageSquare, 
  Globe, 
  School, 
  BookOpen, 
  UserCheck,
  Coffee,
  Network
} from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section with Background Image */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-400 py-20 md:py-28 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-10"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-white animate-fade-up">
            Connect with Students in Japan
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-white/90 animate-fade-up" style={{animationDelay: "0.1s"}}>
            The easiest way for international and local students to make meaningful connections across universities in Japan.
          </p>
          {isAuthenticated ? (
            <Link to="/feed" className="inline-block animate-fade-up" style={{animationDelay: "0.2s"}}>
              <Button size="lg" className="font-medium text-lg px-8 py-6 shadow-lg hover:translate-y-[-2px] transition-all">
                Discover Students <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{animationDelay: "0.2s"}}>
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="font-medium text-lg w-full sm:w-auto px-8 py-6 shadow-lg hover:translate-y-[-2px] transition-all">
                  Get Started <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="font-medium text-lg w-full sm:w-auto px-8 py-6 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 shadow-lg">
                  Log In
                </Button>
              </Link>
            </div>
          )}
          
          {/* Social proof */}
          <div className="mt-12 text-white/80 text-sm md:text-base animate-fade-up" style={{animationDelay: "0.3s"}}>
            <p>Trusted by 5,000+ students from over 20 universities across Japan</p>
          </div>
        </div>
      </section>

      {/* Features Section with Icons and Hover Effects */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How CampusLink Works</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Our simple three-step process makes it easy to connect with other students</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-xl p-8 text-center transition-all duration-300 hover:shadow-xl hover:bg-blue-100 group">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-5 rounded-full group-hover:bg-blue-200 transition-all duration-300 transform group-hover:scale-110">
                  <Users size={36} className="text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">Match With Students</h3>
              <p className="text-gray-600">
                Find students based on shared interests, languages, and fields of study with our smart matching algorithm.
              </p>
              <div className="mt-4 h-0 overflow-hidden group-hover:h-auto group-hover:mt-6 transition-all duration-300">
                <p className="text-blue-600 font-medium">Set your preferences and let our algorithm do the rest!</p>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-8 text-center transition-all duration-300 hover:shadow-xl hover:bg-green-100 group">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 p-5 rounded-full group-hover:bg-green-200 transition-all duration-300 transform group-hover:scale-110">
                  <MessageSquare size={36} className="text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">Chat & Connect</h3>
              <p className="text-gray-600">
                Start conversations with your matches and schedule real-life coffee meetups.
              </p>
              <div className="mt-4 h-0 overflow-hidden group-hover:h-auto group-hover:mt-6 transition-all duration-300">
                <p className="text-green-600 font-medium">Our in-app chat makes it easy to arrange your first meeting!</p>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-8 text-center transition-all duration-300 hover:shadow-xl hover:bg-purple-100 group">
              <div className="flex justify-center mb-6">
                <div className="bg-purple-100 p-5 rounded-full group-hover:bg-purple-200 transition-all duration-300 transform group-hover:scale-110">
                  <Globe size={36} className="text-purple-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">Build Your Network</h3>
              <p className="text-gray-600">
                Expand your social circle and cultural understanding by meeting local and international students.
              </p>
              <div className="mt-4 h-0 overflow-hidden group-hover:h-auto group-hover:mt-6 transition-all duration-300">
                <p className="text-purple-600 font-medium">Make lasting connections across cultures and universities!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section with Contrasting Colors */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Who It's For</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">CampusLink bridges the gap between international and local students</p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full mr-4">
                  <Globe size={28} className="text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-blue-700">International Students</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <UserCheck size={20} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Connect with local students who can help you navigate Japanese culture</span>
                </li>
                <li className="flex items-start">
                  <UserCheck size={20} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Practice your Japanese with native speakers</span>
                </li>
                <li className="flex items-start">
                  <UserCheck size={20} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Find friends who share your interests and academic goals</span>
                </li>
              </ul>
              
              {/* Testimonial */}
              <div className="mt-8 bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-blue-100">
                <p className="italic text-gray-700">"CampusLink helped me find friends who could show me around Tokyo and practice my Japanese. It made my study abroad experience so much better!"</p>
                <p className="text-blue-600 font-medium mt-2">— Emma, Exchange Student from Australia</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-8 shadow-sm border border-orange-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-orange-100 p-4 rounded-full mr-4">
                  <School size={28} className="text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-orange-700">Local Japanese Students</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <UserCheck size={20} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Meet students from all over the world right on your campus</span>
                </li>
                <li className="flex items-start">
                  <UserCheck size={20} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Practice foreign languages with native speakers</span>
                </li>
                <li className="flex items-start">
                  <UserCheck size={20} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <span>Gain international perspectives and build global friendships</span>
                </li>
              </ul>
              
              {/* Testimonial */}
              <div className="mt-8 bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-orange-100">
                <p className="italic text-gray-700">"I wanted to improve my English skills and learn about different cultures. Through CampusLink, I've made friends from the US, France, and Brazil!"</p>
                <p className="text-orange-600 font-medium mt-2">— Hiroshi, Student at Waseda University</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Strong Visual Emphasis */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/30 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white/20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Ready to Connect?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of students across Japan creating meaningful cross-cultural friendships.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-12">
            <div className="flex items-center">
              <Coffee className="text-yellow-300 mr-2" size={24} />
              <span>1,200+ Coffee Meetups</span>
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/40"></div>
            <div className="flex items-center">
              <MessageSquare className="text-green-300 mr-2" size={24} />
              <span>8,500+ Conversations</span>
            </div>
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/40"></div>
            <div className="flex items-center">
              <Network className="text-blue-300 mr-2" size={24} />
              <span>25+ Universities</span>
            </div>
          </div>
          
          {isAuthenticated ? (
            <Link to="/feed">
              <Button size="lg" variant="secondary" className="font-medium text-lg px-10 py-6 bg-white text-blue-700 hover:bg-blue-50 shadow-lg">
                Discover Students <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          ) : (
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="font-medium text-lg px-10 py-6 bg-white text-blue-700 hover:bg-blue-50 shadow-lg">
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
