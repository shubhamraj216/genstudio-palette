// src/components/AppShell.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MessageSquare,
  Image,
  User,
  Menu,
  Sparkles,
  Settings,
  ArrowRight,
} from "lucide-react";
import ChatView from "./views/ChatView";
import AssetsView from "./views/AssetsView";
import ProfileView from "./views/ProfileView";
import AuthModal from "./auth/AuthModal";
import PersonaSidebar from "./persona/PersonaSidebar";
import Homepage from "./Homepage";
import { useAuth } from "@/hooks/use-auth";

type AuthMode = "login" | "signup" | "forgot-password" | "guest";

export default function AppShell() {
  const [isPersonaSidebarOpen, setIsPersonaSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [currentView, setCurrentView] = useState<"chat" | "assets" | "profile">("chat");
  const { chatId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // auth
  const { user, loading: authLoading, logout } = useAuth();

  // Generate new chat UUID when needed (client-temporary id)
  const generateNewChatId = () => {
    return "chat-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  };

  /**
   * Handle new chat creation/navigation.
   * If backendConversationId is provided, navigate to that canonical id.
   * Otherwise, generate a client-side id (fast UI) and navigate to it.
   *
   * ChatView (or whatever triggers creation) should call:
   *   onNewChat(backendConversationId)
   * once the backend returns { conversation_id: "<id>" } so the route will be kept in sync.
   */
  const handleNewChat = (backendConversationId?: string) => {
    if (backendConversationId && typeof backendConversationId === "string") {
      navigate(`/chat/${backendConversationId}`);
      return;
    }
    navigate(`/chat/`);
  };

  // Redirect to new chat if no chatId on /app route
  useEffect(() => {
    if (window.location.pathname === "/app" && !chatId) {
      // create a client-side chat id immediately for UX; backend may later return canonical id
      handleNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // open auth modal helpers
  const openLogin = () => {
    setAuthMode("login");
    setAuthOpen(true);
  };
  const openSignup = () => {
    setAuthMode("signup");
    setAuthOpen(true);
  };
  const openGuest = () => {
    setAuthMode("guest");
    setAuthOpen(true);
  };

  const handleAuthClose = () => {
    setAuthOpen(false);
  };

  // format user display name
  const userDisplayName = user
    ? `${user.first_name ?? ""}'s Playground`.trim() || user.email
    : null;

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold">Assets Studio</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* If authenticated show name + logout icon or simple avatar */}
              {user ? (
                <>
                  <div className="flex items-center gap-2 ml-12">
                    <div className="text-sm font-medium">{userDisplayName}</div>
                    {/*<Button*/}
                    {/*  variant="ghost"*/}
                    {/*  size="icon"*/}
                    {/*  onClick={() => {*/}
                    {/*    logout();*/}
                    {/*  }}*/}
                    {/*>*/}
                    {/*  <User className="h-4 w-4" />*/}
                    {/*</Button>*/}
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={openLogin}>
                    Login
                  </Button>
                  <Button variant="gradient" size="sm" onClick={openSignup}>
                    Sign Up
                  </Button>
                </>
              )}

              <Button variant="ghost" size="icon" onClick={() => setIsPersonaSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 pb-20">
          {currentView === "chat" && <ChatView chatId={chatId} onNewChat={handleNewChat} />}
          {currentView === "assets" && <AssetsView />}
          {currentView === "profile" && <ProfileView />}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="grid grid-cols-3">
            <Button
              variant="ghost"
              className={`h-16 flex-col gap-1 rounded-none ${currentView === "chat" ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setCurrentView("chat")}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">Chat</span>
            </Button>
            <Button
              variant="ghost"
              className={`h-16 flex-col gap-1 rounded-none ${currentView === "assets" ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setCurrentView("assets")}
            >
              <Image className="h-5 w-5" />
              <span className="text-xs">Assets</span>
            </Button>
            <Button
              variant="ghost"
              className={`h-16 flex-col gap-1 rounded-none ${currentView === "profile" ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setCurrentView("profile")}
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </nav>

        {/* Persona Sidebar - Mobile (Bottom Sheet) */}
        {isPersonaSidebarOpen && (
          <PersonaSidebar isOpen={isPersonaSidebarOpen} onClose={() => setIsPersonaSidebarOpen(false)} isMobile={true} />
        )}

        {/* Auth Modal */}
        <AuthModal isOpen={authOpen} onClose={handleAuthClose} initialMode={authMode} />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Assets Studio</span>
            </button>

            <nav className="flex items-center gap-1">
              <Button variant={currentView === "chat" ? "secondary" : "ghost"} onClick={() => setCurrentView("chat")}>
                Chat
              </Button>
              <Button variant={currentView === "assets" ? "secondary" : "ghost"} onClick={() => setCurrentView("assets")}>
                Assets
              </Button>
              <Button variant={currentView === "profile" ? "secondary" : "ghost"} onClick={() => setCurrentView("profile")}>
                Profile
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPersonaSidebarOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Personas
            </Button>

            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{userDisplayName}</span>
                  {/*<Button*/}
                  {/*  variant="ghost"*/}
                  {/*  size="sm"*/}
                  {/*  onClick={() => {*/}
                  {/*    logout();*/}
                  {/*    navigate("/");*/}
                  {/*  }}*/}
                  {/*>*/}
                  {/*  Logout*/}
                  {/*</Button>*/}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={openLogin}>
                  Login
                </Button>
                <Button variant="gradient" size="sm" onClick={openSignup}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Content - Split Screen */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Pane - Chat */}
        <div className="w-1/2 border-r">
          <ChatView chatId={chatId} onNewChat={handleNewChat} />
        </div>

        {/* Right Pane - Assets/Profile */}
        <div className="w-1/2">
          {currentView === "assets" && <AssetsView />}
          {currentView === "profile" && <ProfileView />}
          {currentView === "chat" && <AssetsView />} {/* Show assets by default when chat is active */}
        </div>
      </div>

      {/* Persona Sidebar - Desktop */}
      <PersonaSidebar isOpen={isPersonaSidebarOpen} onClose={() => setIsPersonaSidebarOpen(false)} isMobile={false} />

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={handleAuthClose} initialMode={authMode} />
    </div>
  );
}
