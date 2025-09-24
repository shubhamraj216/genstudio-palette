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
  Settings
} from "lucide-react";
import ChatView from "./views/ChatView";
import AssetsView from "./views/AssetsView";
import ProfileView from "./views/ProfileView";
import AuthModal from "./auth/AuthModal";
import PersonaSidebar from "./persona/PersonaSidebar";
import Homepage from "./Homepage";

export default function AppShell() {
  const [isPersonaSidebarOpen, setIsPersonaSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'assets' | 'profile'>('chat');
  const [showApp, setShowApp] = useState(true);
  const { chatId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Generate new chat UUID when needed
  const generateNewChatId = () => {
    return 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  // Handle new chat creation
  const handleNewChat = () => {
    const newChatId = generateNewChatId();
    navigate(`/chat/${newChatId}`);
  };

  // If no chatId in URL and we're showing the app, redirect to new chat
  useEffect(() => {
    if (showApp && !chatId && window.location.pathname !== '/app') {
      handleNewChat();
    }
  }, [showApp, chatId]);

  // Mock user state - replace with actual auth
  const isAuthenticated = false;
  const user = null;

  // Show homepage for root path
  if (window.location.pathname === '/') {
    return (
      <Homepage 
        onGetStarted={() => handleNewChat()}
        onLogin={() => setShowAuthModal(true)}
      />
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Layout */}
        <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Assets Studio</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPersonaSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 pb-20">
          {currentView === 'chat' && <ChatView chatId={chatId} onNewChat={handleNewChat} />}
          {currentView === 'assets' && <AssetsView />}
          {currentView === 'profile' && <ProfileView />}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="grid grid-cols-3">
            <Button
              variant="ghost"
              className={`h-16 flex-col gap-1 rounded-none ${
                currentView === 'chat' ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setCurrentView('chat')}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">Chat</span>
            </Button>
            <Button
              variant="ghost"
              className={`h-16 flex-col gap-1 rounded-none ${
                currentView === 'assets' ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setCurrentView('assets')}
            >
              <Image className="h-5 w-5" />
              <span className="text-xs">Assets</span>
            </Button>
            <Button
              variant="ghost"
              className={`h-16 flex-col gap-1 rounded-none ${
                currentView === 'profile' ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setCurrentView('profile')}
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </nav>

        {/* Persona Sidebar - Mobile (Bottom Sheet) */}
        {isPersonaSidebarOpen && (
          <PersonaSidebar 
            isOpen={isPersonaSidebarOpen}
            onClose={() => setIsPersonaSidebarOpen(false)}
            isMobile={true}
          />
        )}

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}
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
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Assets Studio</span>
            </div>
            
            <nav className="flex items-center gap-1">
              <Button
                variant={currentView === 'chat' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('chat')}
              >
                Chat
              </Button>
              <Button
                variant={currentView === 'assets' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('assets')}
              >
                Assets
              </Button>
              <Button
                variant={currentView === 'profile' ? 'secondary' : 'ghost'}
                onClick={() => setCurrentView('profile')}
              >
                Profile
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPersonaSidebarOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Personas
            </Button>
            {isAuthenticated ? (
              <Button variant="ghost" size="sm">
                {user?.name || 'Account'}
              </Button>
            ) : (
              <Button 
                variant="gradient" 
                size="sm"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </Button>
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
          {currentView === 'assets' && <AssetsView />}
          {currentView === 'profile' && <ProfileView />}
          {currentView === 'chat' && <AssetsView />} {/* Show assets by default when chat is active */}
        </div>
      </div>

      {/* Persona Sidebar - Desktop */}
      <PersonaSidebar 
        isOpen={isPersonaSidebarOpen}
        onClose={() => setIsPersonaSidebarOpen(false)}
        isMobile={false}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}