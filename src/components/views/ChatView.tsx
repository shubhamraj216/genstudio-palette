import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Send, 
  Sparkles, 
  Image, 
  Video,
  Wand2,
  Bot,
  User
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  assets?: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    prompt: string;
  }>;
}

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI assistant for creating amazing visual assets. Describe what you'd like me to generate and I'll create it for you.",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const isMobile = useIsMobile();

  const quickPrompts = [
    "A futuristic city skyline at sunset",
    "Abstract geometric pattern in blue and gold",
    "Minimalist product mockup on white background",
    "Watercolor landscape with mountains",
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsGenerating(true);

    // Simulate AI response with generated asset
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I've created an image based on your prompt: "${inputValue}". Here's what I generated:`,
        timestamp: new Date(),
        assets: [{
          id: Date.now().toString(),
          type: 'image',
          url: '/placeholder.svg', // This would be the generated image URL
          prompt: inputValue,
        }]
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.type === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary">
                {message.type === 'user' ? (
                  <User className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              
              <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'text-right' : ''}`}>
                <Card className={`p-4 ${
                  message.type === 'user' 
                    ? 'bg-gradient-primary text-primary-foreground ml-auto' 
                    : 'bg-card'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </Card>
                
                {/* Generated Assets */}
                {message.assets && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {message.assets.map((asset) => (
                      <Card key={asset.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {asset.type === 'image' ? (
                            <Image className="h-12 w-12 text-muted-foreground" />
                          ) : (
                            <Video className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-muted-foreground mb-2">
                            "{asset.prompt}"
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Download
                            </Button>
                            <Button size="sm" variant="ghost">
                              Like
                            </Button>
                            <Button size="sm" variant="ghost">
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
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
          {messages.length === 1 && (
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
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isGenerating}
                className="pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled
                >
                  <Image className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled
                >
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isGenerating}
              variant="gradient"
              size="icon"
            >
              {isGenerating ? (
                <Wand2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}