import { useState, useEffect } from "react";
import { ParticleBackground } from "@/components/ParticleBackground";
import { ChatInterface } from "@/components/ChatInterface";
import { FeedbackAnalytics } from "@/components/FeedbackAnalytics";
import { ConversationHistory } from "@/components/ConversationHistory";
import { AuthDialog } from "@/components/AuthDialog";
import { UserProfile } from "@/components/UserProfile";
import { useTheme } from "@/components/ThemeProvider";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Wifi, Cloud, Database, Cpu, BarChart3, MessageSquare, User, LogIn } from "lucide-react";

export default function Home() {
  // All hooks must be at the top level
  const { theme, setTheme } = useTheme();
  const [neonTheme, setNeonTheme] = useState<keyof typeof neonColors>('blue');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoVoice, setAutoVoice] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Use auth hook
  const { user, logout, isLoading: authLoading } = useAuth();

  // Use chat hook - always call this hook
  const {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
    downloadTranscript,
    sessionId,
    switchToConversation,
    createNewConversation
  } = useChat();

  const neonColors = {
    blue: '#00D4FF',
    violet: '#8B5CF6',
    green: '#10B981'
  };

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleAuthSuccess = (data: any) => {
    // Close the auth dialog first
    setShowAuthDialog(false);

    // Handle the authentication data properly
    if (data.user && data.token) {
      // Store the data and reload to reset state
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      // Small delay to ensure dialog closes before reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else if (data.username || data.id) {
      // If we just have user data, reload to refresh auth state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // User is authenticated, ensure dialog is closed
        setShowAuthDialog(false);
      } else {
        // User is not authenticated, show dialog
        setShowAuthDialog(true);
      }
    }
  }, [authLoading, user]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white font-inter">
        <ParticleBackground color={neonColors[neonTheme]} />
        <div className="glass-morphism p-8 rounded-2xl text-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Render auth prompt if no user
  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white font-inter">
        <ParticleBackground color={neonColors[neonTheme]} />
        <div className="text-center z-10">
          <h1 className="text-6xl font-bold text-white mb-4">Arpy AI V2.0</h1>
          <p className="text-xl text-white/80 mb-8">Please sign in to continue</p>
          <Button 
            onClick={() => setShowAuthDialog(true)}
            className="glass-morphism text-white border-white/30 hover:bg-white/20"
          >
            Sign In
          </Button>
          <AuthDialog 
            open={showAuthDialog} 
            onOpenChange={setShowAuthDialog} 
            neonColor={neonColors[neonTheme]} 
            onAuthSuccess={handleAuthSuccess}
          />
        </div>
      </div>
    );
  }

  // Main app content for authenticated users
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter">
      <ParticleBackground color={neonColors[neonTheme]} />

      {/* Conversation History Sidebar */}
      <ConversationHistory
        currentSessionId={sessionId}
        onSelectConversation={switchToConversation}
        onNewConversation={createNewConversation}
        neonColor={neonColors[neonTheme]}
      />

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div 
                className="w-10 h-10 bg-gradient-to-r rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${neonColors[neonTheme]}, rgba(255,255,255,0.2))`
                }}
              >
                <i className="fas fa-robot text-white text-xl"></i>
              </div>
              <div>
                <h1 
                  className="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
                  style={{
                    background: `linear-gradient(135deg, ${neonColors[neonTheme]}, rgba(255,255,255,0.8))`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Arpy AI V2.0
                </h1>
                <p className="text-sm text-gray-400">Advanced AI Assistant</p>
              </div>
            </div>

            {/* Theme Controls & Auth */}
            <div className="flex items-center space-x-4">
              <div className="glass-morphism rounded-lg p-2 flex space-x-2">
                {Object.entries(neonColors).map(([colorName, colorValue]) => (
                  <button
                    key={colorName}
                    className="w-6 h-6 rounded-full transition-all hover:scale-110 ring-2 ring-transparent hover:ring-white/20"
                    style={{ backgroundColor: colorValue }}
                    onClick={() => setNeonTheme(colorName as keyof typeof neonColors)}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="glass-morphism hover:bg-white/20"
                onClick={toggleDarkMode}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Authentication */}
              <UserProfile
                user={user}
                onLogout={logout}
                neonColor={neonColors[neonTheme]}
              />
            </div>
          </div>
        </div>

        {/* Main Controls */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className={`glass-morphism hover:bg-white/20 transition-all ${!showAnalytics ? 'bg-white/20' : ''}`}
                onClick={() => setShowAnalytics(false)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`glass-morphism hover:bg-white/20 transition-all ${showAnalytics ? 'bg-white/20' : ''}`}
                onClick={() => setShowAnalytics(true)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <main className="flex-1 flex flex-col relative z-10 p-6 h-[calc(100vh-140px)]">
        {/* Chat Interface */}
        {!showAnalytics ? (
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onClearConversation={clearConversation}
            onDownloadTranscript={downloadTranscript}
            onNewConversation={createNewConversation}
            neonColor={neonColors[neonTheme]}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            autoVoice={autoVoice}
            setAutoVoice={setAutoVoice}
            sessionId={sessionId}
          />
        ) : (
          <div className="max-w-7xl mx-auto">
            <FeedbackAnalytics neonColor={neonColors[neonTheme]} />
          </div>
        )}

        {/* Authentication Dialog */}
        <AuthDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          onAuthSuccess={handleAuthSuccess}
          neonColor={neonColors[neonTheme]}
        />
      </main>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-morphism p-8 rounded-2xl text-center">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: neonColors[neonTheme] }}
            ></div>
            <p className="text-white text-lg">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}