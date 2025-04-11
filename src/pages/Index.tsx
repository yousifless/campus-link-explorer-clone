
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Calendar, MessageSquare, Award } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="campus-container">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2 space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold text-campus-blue leading-tight">
                Connect, Collaborate, and Thrive on Campus
              </h1>
              <p className="text-xl text-gray-700">
                Join CampusLink to connect with fellow students, discover events, 
                join groups, and make the most of your campus experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link to="/signup">
                  <Button size="lg" className="bg-campus-blue hover:bg-campus-lightBlue">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 animate-fade-up">
              <div className="relative rounded-xl bg-white p-2 shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="Students on campus" 
                  className="rounded-lg w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="campus-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-campus-blue mb-4">Everything You Need on Campus</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              CampusLink brings together all the tools and connections you need for a successful and engaging campus experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="campus-card p-6 text-center animate-fade-up">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-campus-blue" />
              </div>
              <h3 className="text-xl font-semibold text-campus-blue mb-2">Connect</h3>
              <p className="text-gray-600">
                Build your network with classmates, professors, and alumni for academic and career opportunities.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="campus-card p-6 text-center animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-campus-blue" />
              </div>
              <h3 className="text-xl font-semibold text-campus-blue mb-2">Events</h3>
              <p className="text-gray-600">
                Discover and join campus events, workshops, and activities that match your interests.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="campus-card p-6 text-center animate-fade-up" style={{ animationDelay: '200ms' }}>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-campus-blue" />
              </div>
              <h3 className="text-xl font-semibold text-campus-blue mb-2">Groups</h3>
              <p className="text-gray-600">
                Join study groups, clubs, and communities that align with your academic and personal interests.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="campus-card p-6 text-center animate-fade-up" style={{ animationDelay: '300ms' }}>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-campus-blue" />
              </div>
              <h3 className="text-xl font-semibold text-campus-blue mb-2">Resources</h3>
              <p className="text-gray-600">
                Access shared academic resources, materials, and collaboration opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-campus-blue py-16">
        <div className="campus-container">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to enhance your campus experience?</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Join thousands of students already connecting and collaborating on CampusLink.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-campus-blue hover:bg-gray-100">
                Join CampusLink Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="campus-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-campus-blue mb-4">What Students Are Saying</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from students who have transformed their campus experience with CampusLink.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="campus-card p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-200 mr-4">
                  <img 
                    src="https://randomuser.me/api/portraits/women/44.jpg" 
                    alt="Student" 
                    className="w-12 h-12 rounded-full"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Sarah Johnson</h4>
                  <p className="text-sm text-gray-500">Computer Science, Junior</p>
                </div>
              </div>
              <p className="text-gray-600">
                "CampusLink helped me find my study group for algorithms class. I've made great friends and improved my grades!"
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="campus-card p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-200 mr-4">
                  <img 
                    src="https://randomuser.me/api/portraits/men/32.jpg" 
                    alt="Student" 
                    className="w-12 h-12 rounded-full"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">David Chen</h4>
                  <p className="text-sm text-gray-500">Business, Senior</p>
                </div>
              </div>
              <p className="text-gray-600">
                "I discovered so many events and networking opportunities through CampusLink that helped me secure my internship."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="campus-card p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-200 mr-4">
                  <img 
                    src="https://randomuser.me/api/portraits/women/68.jpg" 
                    alt="Student" 
                    className="w-12 h-12 rounded-full"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Maya Patel</h4>
                  <p className="text-sm text-gray-500">Biology, Freshman</p>
                </div>
              </div>
              <p className="text-gray-600">
                "As a new student, CampusLink helped me quickly connect with peers and find clubs that made me feel at home on campus."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
