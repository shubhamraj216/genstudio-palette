import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Download, 
  History, 
  Image as ImageIcon, 
  Video,
  TrendingUp,
  Calendar,
  Settings,
  Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: Date;
}

export default function ProfileView() {
  const [activeTab, setActiveTab] = useState("liked");
  const { toast } = useToast();

  // Mock user data
  const user = {
    name: "Alex Chen",
    email: "alex@example.com",
    avatar: "/placeholder.svg",
    isPro: false,
    joinedDate: new Date(2024, 0, 15),
  };

  // Mock usage stats
  const usageStats = {
    generationsToday: 12,
    dailyLimit: 25,
    totalAssets: 147,
    totalDownloads: 89,
  };

  // Mock assets
  const likedAssets: Asset[] = [
    {
      id: '1',
      type: 'image',
      url: '/placeholder.svg',
      prompt: 'A futuristic city skyline at sunset',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      type: 'video',
      url: '/placeholder.svg',
      prompt: 'Animated logo reveal with particles',
      timestamp: new Date(Date.now() - 7200000),
    },
  ];

  const downloadedAssets: Asset[] = [
    {
      id: '3',
      type: 'image',
      url: '/placeholder.svg',
      prompt: 'Abstract geometric pattern in blue and gold',
      timestamp: new Date(Date.now() - 10800000),
    },
  ];

  const recentHistory: Asset[] = [
    ...likedAssets,
    ...downloadedAssets,
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const handleRemoveFromLiked = (assetId: string) => {
    toast({
      title: "Removed",
      description: "Asset removed from liked collection.",
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-semibold">{user.name}</h1>
                    {user.isPro && (
                      <Badge variant="secondary" className="bg-gradient-accent">
                        <Crown className="mr-1 h-3 w-3" />
                        Pro
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Calendar className="inline mr-1 h-3 w-3" />
                    Member since {user.joinedDate.toLocaleDateString()}
                  </p>
                </div>
                
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Today's Usage</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{usageStats.generationsToday}</span>
                <span className="text-sm text-muted-foreground">/ {usageStats.dailyLimit}</span>
              </div>
              <Progress 
                value={(usageStats.generationsToday / usageStats.dailyLimit) * 100} 
                className="h-2"
              />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Assets</span>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">{usageStats.totalAssets}</span>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Downloads</span>
              <Download className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">{usageStats.totalDownloads}</span>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Liked</span>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">{likedAssets.length}</span>
          </Card>
        </div>

        {/* Asset Collections */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="liked" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Liked ({likedAssets.length})
              </TabsTrigger>
              <TabsTrigger value="downloaded" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Downloaded ({downloadedAssets.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History ({recentHistory.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="liked" className="mt-6">
              {likedAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No liked assets yet</h3>
                  <p className="text-muted-foreground">
                    Heart assets in the chat or assets view to see them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {likedAssets.map((asset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        {asset.type === 'image' ? (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        ) : (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm line-clamp-2 mb-2">{asset.prompt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {asset.timestamp.toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromLiked(asset.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="downloaded" className="mt-6">
              {downloadedAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Download className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No downloads yet</h3>
                  <p className="text-muted-foreground">
                    Download assets to see them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {downloadedAssets.map((asset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        {asset.type === 'image' ? (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        ) : (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm line-clamp-2 mb-2">{asset.prompt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {asset.timestamp.toLocaleDateString()}
                          </span>
                          <Button variant="outline" size="sm">
                            Download Again
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <div className="space-y-4">
                {recentHistory.map((asset) => (
                  <Card key={asset.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        {asset.type === 'image' ? (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <Video className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{asset.prompt}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.timestamp.toLocaleDateString()} • {asset.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Upgrade CTA */}
        {!user.isPro && (
          <Card className="p-6 bg-gradient-subtle">
            <div className="text-center">
              <Crown className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
              <p className="text-muted-foreground mb-4">
                Unlimited generations, higher quality outputs, and priority processing.
              </p>
              <Button variant="gradient" size="lg">
                Upgrade Now
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}