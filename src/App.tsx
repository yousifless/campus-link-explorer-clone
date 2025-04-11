
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { MatchingProvider } from "./contexts/matching";
import { ConversationProvider } from "./contexts/ConversationContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ProfileSetup from "./pages/ProfileSetup";
import PrivateRoute from "./components/auth/PrivateRoute";
import Chat from "./pages/Chat";
import Matches from "./pages/Matches";
import Notifications from "./pages/Notifications";
import ChatConversation from "./pages/ChatConversation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <MatchingProvider>
              <ConversationProvider>
                <NotificationProvider>
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route element={<MainLayout />}>
                      <Route path="/" element={<Index />} />
                      <Route path="/feed" element={<PrivateRoute component={Feed} />} />
                      <Route path="/profile" element={<PrivateRoute component={Profile} />} />
                      <Route path="/profile-setup" element={<PrivateRoute component={ProfileSetup} />} />
                      <Route path="/matches" element={<PrivateRoute component={Matches} />} />
                      <Route path="/chat" element={<PrivateRoute component={Chat} />} />
                      <Route path="/chat/:id" element={<PrivateRoute component={ChatConversation} />} />
                      <Route path="/notifications" element={<PrivateRoute component={Notifications} />} />
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </NotificationProvider>
              </ConversationProvider>
            </MatchingProvider>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
