// src/components/views/ChatView.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Sparkles,
  Image,
  Video,
  Wand2,
  Bot,
  User,
  Download,
  Heart,
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  assets?: Array<{
    id: string;
    type: "image" | "video" | string;
    url: string;
    prompt?: string;
    liked?: boolean;
  }>;
}

interface ChatViewProps {
  chatId?: string;
  // AppShell's handleNewChat accepts an optional backend id; keep flexible
  onNewChat?: (backendConversationId?: string) => void;
}

const BACKEND_BASE = "https://python-genai.railway.internal"; // change if backend URL differs

export default function ChatView({ chatId, onNewChat }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm your AI assistant for creating amazing visual assets. Describe what you'd like me to generate and I'll create it for you.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const quickPrompts = [
    "A futuristic city skyline at sunset",
    "Abstract geometric pattern in blue and gold",
    "Minimalist product mockup on white background",
    "Watercolor landscape with mountains",
  ];

  function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Fetch conversation messages when chatId changes
  useEffect(() => {
    const fetchConversation = async (cid: string) => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_BASE}/api/conversations/${cid}`, {
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        });
        if (!res.ok) {
          console.warn("failed to fetch conversation", res.status);
          setMessages([]);
          setLoading(false);
          return;
        }
        const conv = await res.json();
        // conv expected shape: { id, owner_id, title, messages: [ { id, role, content, timestamp, assets? } ] }
        const parsed: Message[] = (conv.messages || []).map((m: any) => ({
          id: m.id,
          type: m.role === "user" ? "user" : "assistant",
          content: m.content,
          timestamp: new Date(m.timestamp),
          assets: m.assets?.map((a: any) => ({
            id: a.id,
            type: a.type,
            url: a.url.startsWith("http") ? a.url : `${BACKEND_BASE}${a.url}`,
            prompt: a.prompt,
            liked: !!a.liked,
          })),
        }));
        setMessages(parsed.length ? parsed : []);
      } catch (e) {
        console.error("error loading conversation", e);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchConversation(chatId);
    } else {
      // no chatId: keep the default welcome message
      setMessages((prev) => {
        // If current messages are only the assistant welcome, keep it; otherwise clear
        if (prev.length === 1 && prev[0].type === "assistant") return prev;
        return [
          {
            id: "1",
            type: "assistant",
            content:
              "Hello! I'm your AI assistant for creating amazing visual assets. Describe what you'd like me to generate and I'll create it for you.",
            timestamp: new Date(),
          },
        ];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Send / generate handler — uses conversation_id field and syncs route via onNewChat
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isGenerating) return;

    const promptToSend = inputValue;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: promptToSend,
      timestamp: new Date(),
    };

    // optimistic UI
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsGenerating(true);

    try {
      const res = await fetch(`${BACKEND_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ prompt: promptToSend, conversation_id: chatId }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("generation failed:", res.status, text);
        toast({ title: "Generation failed", description: "Server returned an error." });
        setIsGenerating(false);
        return;
      }

      const data = await res.json();

      // Sync conversation id with backend (so AppShell can update route)
      if (data.conversation_id && data.conversation_id !== chatId) {
        onNewChat?.(data.conversation_id);
      }

      // build assistant message from backend
      const msg = data.message;
      const parsed: Message = {
        id: msg.id,
        type: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        assets: msg.assets?.map((a: any) => ({
          id: a.id,
          type: a.type,
          url: a.url.startsWith("http") ? a.url : `${BACKEND_BASE}${a.url}`,
          prompt: a.prompt,
          liked: !!a.liked,
        })),
      };

      setMessages((prev) => [...prev, parsed]);
    } catch (err) {
      console.error("generate error", err);
      toast({ title: "Error", description: "Could not generate image. Check console." });
    } finally {
      setIsGenerating(false);
    }
  }, [inputValue, isGenerating, chatId, onNewChat, toast]);

  // Add to assets (create then toggle like) — unchanged logic, wrapped in component
  const handleAddToAssets = async (assetId: string) => {
    const found = messages.flatMap((m) => m.assets ?? []).find((a) => a.id === assetId);
    if (!found) {
      toast({ title: "Asset not found", description: "Can't find asset in messages." });
      return;
    }

    const payload = {
      id: found.id,
      type: found.type,
      url: found.url,
      prompt: found.prompt || "",
    };

    toast({ title: "Saving...", description: "Updating asset on server." });

    try {
      // ensure exists
      const createRes = await fetch(`${BACKEND_BASE}/api/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) {
        const txt = await createRes.text();
        throw new Error(`create failed: ${createRes.status} ${txt}`);
      }
      const created = await createRes.json();

      // toggle-like
      const toggleRes = await fetch(`${BACKEND_BASE}/api/assets/${assetId}/toggle-like`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      if (!toggleRes.ok) {
        const txt = await toggleRes.text();
        throw new Error(`toggle-like failed: ${toggleRes.status} ${txt}`);
      }
      const updated = await toggleRes.json();

      if (updated.deleted) {
        toast({ title: "Removed from Assets", description: "Removed from your collection." });
        // update chat messages to mark asset as unliked (if you store liked flag there)
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            assets: m.assets?.map((a) => (a.id === assetId ? { ...a, liked: false } : a)),
          }))
        );
        // notify assets page to refresh
        window.dispatchEvent(new CustomEvent("assets:changed", { detail: { id: assetId, deleted: true } }));
        return;
      }

      // liked true
      toast({ title: updated.liked ? "Added to Assets" : "Updated" });

      // update messages to mark asset liked
      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          assets: m.assets?.map((a) => (a.id === assetId ? { ...a, liked: !!updated.liked } : a)),
        }))
      );

      // notify assets page to refresh
      window.dispatchEvent(new CustomEvent("assets:changed", { detail: updated || created }));
    } catch (err) {
      console.error("handleAddToAssets error", err);
      toast({ title: "Error", description: "Could not update asset." });
    }
  };

  const handleDownload = (assetUrl: string, filename?: string) => {
    // create an anchor and click it to download
    const a = document.createElement("a");
    a.href = assetUrl;
    a.download = filename || ""; // let browser decide filename if empty
    // For cross-origin downloads, ensure server sends proper headers (CORS + Content-Disposition)
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast({
      title: "Downloaded",
      description: "Asset saved to your device.",
    });
  };

  return (
    <div
      className={`flex flex-col ${
        isMobile ? "h-[calc(100vh-8rem)]" : "h-[calc(100vh-4rem)]"
      }`}
    >
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">No messages — start the conversation.</div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.type === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary">
                  {message.type === "user" ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>

                <div className={`flex-1 max-w-[80%] ${message.type === "user" ? "text-right" : ""}`}>
                  <Card
                    className={`p-4 ${
                      message.type === "user" ? "bg-gradient-primary text-primary-foreground ml-auto" : "bg-card"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </Card>

                  {/* Generated Assets */}
                  {message.assets && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {message.assets.map((asset) => (
                        <Card
                          key={asset.id}
                          className="overflow-hidden cursor-pointer"
                          onClick={() => setSelectedImage(asset.url)}
                        >
                          <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                            {asset.type === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={asset.url}
                                alt={asset.prompt ?? "generated image"}
                                loading="lazy"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // fallback to a placeholder icon or image when the thumbnail fails to load
                                  (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            ) : (
                              <Video className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-muted-foreground mb-2">"{asset.prompt}"</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Use asset.url as the download href
                                  handleDownload(asset.url, `${asset.id}.png`);
                                }}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToAssets(asset.id);
                                }}
                              >
                                <Heart className="h-3 w-3 mr-1" />
                                {asset.liked ? "Liked" : "Like"}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading / Generating indicator */}
          {isGenerating && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <Card className="p-4 bg-card">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generating your asset...</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t bg-card/50 p-4">
        <div className="mx-auto max-w-4xl">
          {/* Quick Prompts */}
          {messages.length === 1 && messages[0].type === "assistant" && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Try these prompts:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(prompt)}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe what you want to create..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isGenerating}
                className="pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled>
                  <Image className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled>
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isGenerating} variant="gradient" size="icon">
              {isGenerating ? <Wand2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Generated Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="p-6">
              <div className="aspect-video bg-muted flex items-center justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedImage} alt="generated" className="max-h-[60vh] object-contain" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // You may wire add-to-assets to selected image id if you keep track of it
                      // handleAddToAssets('selected');
                      toast({ title: "Add to assets", description: "Use the Like button on the image card to add to assets." });
                    }}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Add to Assets
                  </Button>
                  <Button variant="gradient" onClick={() => handleDownload(selectedImage, undefined)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
