
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Globe, Users, Coffee, BookOpen, School, Languages } from 'lucide-react';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 py-16 md:py-24">
        {/* Background animated circles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-400 opacity-20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-400 opacity-20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-400 opacity-20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Connect with Students Across Japan
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl mb-10 text-indigo-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Build meaningful connections with local and international students, 
              share experiences, and discover new cultures.
            </motion.p>
            
            {!user ? (
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg font-medium bg-white text-indigo-700 hover:bg-indigo-50 hover:scale-105 transition-all duration-300">
                    Join Now <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg font-medium border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                    Log In
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link to="/feed">
                  <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg font-medium bg-white text-indigo-700 hover:bg-indigo-50 hover:scale-105 transition-all duration-300">
                    Discover Students <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </motion.div>
            )}
            
            <motion.div 
              className="mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-white/70 hover:text-white flex flex-col items-center transition-colors"
              >
                <span>Learn more</span>
                <svg className="w-6 h-6 mt-2 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted by section */}
      <section className="py-10 bg-gradient-to-b from-indigo-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-500 mb-6">Trusted by 5,000+ students from over 20 universities across Japan</p>
            
            <div className="flex flex-wrap justify-center gap-8 opacity-70">
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/University_of_Tokyo_logo.svg" alt="University of Tokyo" className="h-12 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/en/d/da/Waseda_University_Logo.svg" alt="Waseda University" className="h-12 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Kyoto_University_logo.svg" alt="Kyoto University" className="h-12 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Osaka_University_logo.svg" alt="Osaka University" className="h-12 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/1/1d/Tohoku_University_Logo.svg" alt="Tohoku University" className="h-12 object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How CampusLink Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our innovative platform makes it easy to connect with students who share your interests and goals</p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-indigo-50">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Create Your Profile</h3>
              <p className="text-gray-600 mb-4">
                Set up your profile with your interests, languages, and what you're looking for in new connections.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-sm">✓</div>
                  Showcase your personality
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-sm">✓</div>
                  Add your languages and proficiency
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-sm">✓</div>
                  Share your academic interests
                </li>
              </ul>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-purple-50">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 text-purple-600">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Match with Students</h3>
              <p className="text-gray-600 mb-4">
                Our algorithm finds the perfect matches based on shared interests, language skills, and academic goals.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-sm">✓</div>
                  Smart matching algorithm
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-sm">✓</div>
                  Find both local and international students
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-sm">✓</div>
                  Connect based on compatibility scores
                </li>
              </ul>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-blue-50">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
                <Coffee className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Meet Up</h3>
              <p className="text-gray-600 mb-4">
                Chat with your matches and arrange coffee meetups to build genuine connections in real life.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-sm">✓</div>
                  Schedule coffee meetups
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-sm">✓</div>
                  Exchange language skills
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-2 text-sm">✓</div>
                  Build lasting friendships
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features section with image */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-indigo-400 opacity-30 rounded-full mix-blend-multiply filter blur-xl"></div>
                <div className="absolute top-1/3 -right-6 w-32 h-32 bg-purple-400 opacity-30 rounded-full mix-blend-multiply filter blur-xl"></div>
                <img 
                  src="/lovable-uploads/0c9db494-ff6f-40ca-986c-a7fc9fcb21f9.png" 
                  alt="Student connections" 
                  className="rounded-2xl shadow-2xl relative z-10 border-8 border-white"
                />
              </div>
            </motion.div>
            
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Bridging Cultural Gaps Through Meaningful Connections</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600">
                    <Languages className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Language Exchange</h3>
                    <p className="text-gray-600">Practice languages with native speakers while helping others learn your mother tongue.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 text-purple-600">
                    <School className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Cultural Immersion</h3>
                    <p className="text-gray-600">Experience authentic local culture through the eyes of those who know it best.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Academic Support</h3>
                    <p className="text-gray-600">Connect with students in your field to share knowledge and resources.</p>
                  </div>
                </div>
              </div>
              
              {!user ? (
                <Link to="/signup" className="inline-block mt-8">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg rounded-full transition-all hover:shadow-lg hover:translate-y-[-2px]">
                    Get Started <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link to="/feed" className="inline-block mt-8">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg rounded-full transition-all hover:shadow-lg hover:translate-y-[-2px]">
                    Find Matches <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Student Experiences</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">See how CampusLink has transformed the study experience of students across Japan</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Student" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold">Emily Johnson</h4>
                  <p className="text-sm text-gray-600">Exchange Student, Waseda University</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "CampusLink helped me find Japanese students who wanted to practice English while helping me with my Japanese. I've made friends I never would have met otherwise!"
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Student" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold">Takashi Yamada</h4>
                  <p className="text-sm text-gray-600">Local Student, Tokyo University</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "I wanted to improve my English but was too shy to approach international students. Through CampusLink, I've made friends from the US, UK, and Australia!"
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Student" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold">Maria Rodriguez</h4>
                  <p className="text-sm text-gray-600">Graduate Student, Kyoto University</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "As a research student, I was looking for peers in my field. CampusLink helped me find study partners who have become collaborators on my research projects."
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Connect?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of students building friendships and creating memories that last a lifetime.
            </p>
            
            {!user ? (
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="px-8 py-6 text-lg font-medium bg-white text-indigo-700 hover:bg-indigo-50 hover:scale-105 transition-all duration-300">
                  Join CampusLink <ArrowRight className="ml-2" />
                </Button>
              </Link>
            ) : (
              <Link to="/feed">
                <Button size="lg" variant="secondary" className="px-8 py-6 text-lg font-medium bg-white text-indigo-700 hover:bg-indigo-50 hover:scale-105 transition-all duration-300">
                  Find New Connections <ArrowRight className="ml-2" />
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Add animation keyframes to tailwind.config.ts */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
