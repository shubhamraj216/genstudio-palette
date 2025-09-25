import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  MessageSquare,
  Image,
  Palette,
  Video,
  ArrowRight,
} from "lucide-react";
import heroGradient from "@/assets/hero-gradient.jpg";

interface HomepageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  userName?: string | null;
  onLogout?: () => void;
}

type ConvSummary = {
  id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
};

const API_BASE = "http://python-genai.railway.internal";
const TOKEN_KEY = "access_token";

export default function Homepage({
  onGetStarted,
  onLogin,
  userName,
  onLogout,
}: HomepageProps) {
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [convsError, setConvsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConvs = async () => {
      if (!userName) return; // don't fetch when not signed-in
      setLoadingConvs(true);
      setConvsError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      if (!token) {
        setLoadingConvs(false);
        setConvsError("No auth token");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/recent-conversations`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`${res.status} ${text}`);
        }
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch (err: any) {
        console.warn("Could not fetch conversations", err);
        setConvsError(err?.message || "Failed to load conversations");
        setConversations([]);
      } finally {
        setLoadingConvs(false);
      }
    };

    fetchConvs();
  }, [userName]);

  const openConversation = (id: string) => {
    // navigate to chat route for the conversation
    // replace with router navigate if you have one in parent
    window.location.href = `/chat/${id}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Assets Studio</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {userName ? (
              <>
                <span className="text-sm font-medium">{userName}</span>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onLogin}>
                  Login
                </Button>
                <Button variant="gradient" size="sm" onClick={onGetStarted}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-subtle py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroGradient})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.1,
          }}
        />

        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Create stunning visuals with{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                AI
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              From chat to canvas in seconds. Describe your idea, and let AI
              generate images and videos instantly.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6"
                onClick={onGetStarted}
              >
                Start Creating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {/* show Login only when not logged in */}
              {!userName && (
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={onLogin}
                >
                  Login
                </Button>
              )}
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Start free — no credit card required
            </p>
          </div>

          {/* Recent conversations box (only when signed in) */}
          {userName && (
            <div className="mt-8 mx-auto max-w-4xl bg-card p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Recent Conversations</h3>
                <button
                  className="text-xs text-muted-foreground"
                  onClick={() => onGetStarted()}
                >
                  New chat
                </button>
              </div>

              {loadingConvs ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : convsError ? (
                <div className="text-sm text-destructive">Error: {convsError}</div>
              ) : conversations.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent conversations</div>
              ) : (
                <ul className="space-y-2">
                  {conversations.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => openConversation(c.id)}
                        className="w-full text-left py-2 px-3 rounded hover:bg-muted/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {c.title || `Chat ${c.id.slice(0, 6)}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.message_count ?? 0} messages •{" "}
                            {new Date(c.updated_at || c.created_at || "").toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">Open</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold md:text-4xl">
                Type a prompt → see results instantly
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Experience the magic of AI-powered visual creation
              </p>
            </div>

            <Card className="overflow-hidden shadow-large">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                  {/* Chat Mockup */}
                  <div className="p-8 border-r">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-6">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Chat</span>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-muted rounded-lg p-3 max-w-xs">
                          <p className="text-sm">
                            Create a futuristic cityscape at sunset with flying
                            cars
                          </p>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-3 max-w-xs ml-auto">
                          <p className="text-sm">✨ Generating your image...</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assets Mockup */}
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Image className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Generated Assets</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="aspect-square bg-gradient-primary rounded-lg opacity-80" />
                      <div className="aspect-square bg-gradient-accent rounded-lg opacity-60" />
                      <div className="aspect-square bg-gradient-subtle rounded-lg opacity-90" />
                      <div className="aspect-square bg-muted rounded-lg opacity-40" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-32 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold md:text-4xl">
                Everything you need to create
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful AI tools designed for creators, marketers, and teams
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center shadow-medium hover:shadow-large transition-shadow">
                <CardContent className="p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary mx-auto mb-6">
                    <MessageSquare className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Chat-first creation</h3>
                  <p className="text-muted-foreground">
                    Describe what you want, we'll generate it. No complex tools
                    or technical skills required.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center shadow-medium hover:shadow-large transition-shadow">
                <CardContent className="p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-accent mx-auto mb-6">
                    <Video className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    Image + video support
                  </h3>
                  <p className="text-muted-foreground">
                    From icons to motion clips. Generate static images and
                    dynamic videos with the same ease.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center shadow-medium hover:shadow-large transition-shadow">
                <CardContent className="p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-subtle mx-auto mb-6">
                    <Palette className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Personas</h3>
                  <p className="text-muted-foreground">
                    Stay consistent with style and tone. Create custom personas
                    for different projects and brands.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl mb-6">
              Turn your ideas into visuals instantly
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of creators who are already using AI to bring
              their ideas to life.
            </p>

            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-6"
              onClick={onGetStarted}
            >
              Start Creating Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-semibold">Assets Studio</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered visual creation platform for modern creators.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Assets Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
