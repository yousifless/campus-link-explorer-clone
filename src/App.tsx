
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Feed from "./pages/Feed";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { MatchingProvider } from "./contexts/matching";
import { ConversationProvider } from "./contexts/ConversationContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { GoogleMapsProvider } from "./providers/GoogleMapsProvider";
import ProfileSetup from "./pages/ProfileSetup";
import PrivateRoute from "./components/auth/PrivateRoute";
import Chat from "./pages/Chat";
import Matches from "./pages/Matches";
import Notifications from "./pages/Notifications";
import Deals from "./pages/Deals";
import Meetups from "./pages/Meetups";
import ChatTest from './pages/ChatTest';
import DirectChat from './pages/DirectChat';
import StorageTestPage from './pages/StorageTestPage';
import ProfilePage from './pages/ProfilePage';
import MeetupPage from './pages/MeetupPage';
import Dashboard from './pages/Dashboard';
import MeetupDetails from './pages/MeetupDetails';
import HomePage from "./pages/HomePage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <MatchingProvider>
              <ConversationProvider>
                <NotificationProvider>
                  <GoogleMapsProvider>
                    <TooltipProvider>
                      <div className="min-h-screen bg-gray-50">
                        <MainLayout>
                          <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/index" element={<Index />} />
                            <Route path="/feed" element={<PrivateRoute component={Feed} />} />
                            <Route path="/profile" element={<PrivateRoute component={ProfilePage} />} />
                            <Route path="/profile-setup" element={<PrivateRoute component={ProfileSetup} />} />
                            <Route path="/matches" element={<PrivateRoute component={Matches} />} />
                            <Route path="/notifications" element={<PrivateRoute component={Notifications} />} />
                            <Route path="/deals" element={<PrivateRoute component={Deals} />} />
                            <Route path="/meetups" element={<PrivateRoute component={Meetups} />} />
                            <Route path="/meetup/:id" element={<PrivateRoute component={MeetupPage} />} />
                            <Route path="/meetups/:id" element={<PrivateRoute component={MeetupDetails} />} />
                            <Route path="/chat" element={<PrivateRoute component={Chat} />} />
                            <Route path="/chat/:id" element={<PrivateRoute component={DirectChat} />} />
                            <Route path="/chat-test" element={<PrivateRoute component={ChatTest} />} />
                            <Route path="/storage-test" element={<PrivateRoute component={StorageTestPage} />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<SignUp />} />
                            <Route path="/dashboard" element={<PrivateRoute component={Dashboard} />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </MainLayout>
                      </div>
                    </TooltipProvider>
                  </GoogleMapsProvider>
                </NotificationProvider>
              </ConversationProvider>
            </MatchingProvider>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
      <Sonner />
    </QueryClientProvider>
  );
}

export default App;
