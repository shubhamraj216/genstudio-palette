import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Download, 
  Heart, 
  RotateCcw,
  Copy,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  Grid3X3,
  List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: Date;
  liked: boolean;
  downloads: number;
}

export default function AssetsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const { toast } = useToast();

  // Mock assets data
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1',
      type: 'image',
      url: '/placeholder.svg',
      prompt: 'A futuristic city skyline at sunset with flying cars',
      timestamp: new Date(Date.now() - 3600000),
      liked: true,
      downloads: 5,
    },
    {
      id: '2',
      type: 'image',
      url: '/placeholder.svg',
      prompt: 'Abstract geometric pattern in blue and gold',
      timestamp: new Date(Date.now() - 7200000),
      liked: false,
      downloads: 2,
    },
    {
      id: '3',
      type: 'video',
      url: '/placeholder.svg',
      prompt: 'Animated logo reveal with particles',
      timestamp: new Date(Date.now() - 10800000),
      liked: true,
      downloads: 8,
    },
  ]);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || asset.type === filter;
    return matchesSearch && matchesFilter;
  });

  const handleLike = (assetId: string) => {
    setAssets(prev => prev.map(asset => 
      asset.id === assetId ? { ...asset, liked: !asset.liked } : asset
    ));
    toast({
      title: "Updated",
      description: "Asset added to your liked collection.",
    });
  };

  const handleDownload = (asset: Asset) => {
    setAssets(prev => prev.map(a => 
      a.id === asset.id ? { ...a, downloads: a.downloads + 1 } : a
    ));
    toast({
      title: "Downloaded",
      description: `${asset.type === 'image' ? 'Image' : 'Video'} saved to your device.`,
    });
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard.",
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Your Assets</h1>
              <p className="text-sm text-muted-foreground">
                {filteredAssets.length} assets generated
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your assets..."
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'image' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('image')}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Images
              </Button>
              <Button
                variant={filter === 'video' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('video')}
              >
                <Video className="mr-2 h-4 w-4" />
                Videos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No assets yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Start by describing what you want to create in the chat.
              </p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-4"
            }>
              {filteredAssets.map((asset) => (
                <Card 
                  key={asset.id} 
                  className={`overflow-hidden cursor-pointer transition-all hover:shadow-medium ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className={`relative ${
                    viewMode === 'list' ? 'w-32 h-20' : 'aspect-video'
                  } bg-muted flex items-center justify-center`}>
                    {asset.type === 'image' ? (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <Video className="h-8 w-8 text-muted-foreground" />
                    )}
                    <Badge 
                      className="absolute top-2 right-2 text-xs"
                      variant={asset.type === 'image' ? 'secondary' : 'outline'}
                    >
                      {asset.type}
                    </Badge>
                  </div>
                  
                  <div className="p-3 flex-1">
                    <p className="text-sm font-medium line-clamp-2 mb-2">
                      {asset.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{asset.timestamp.toLocaleDateString()}</span>
                      <span>{asset.downloads} downloads</span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(asset.id);
                          }}
                          className={asset.liked ? 'text-red-500' : ''}
                        >
                          <Heart 
                            className={`h-4 w-4 ${asset.liked ? 'fill-current' : ''}`} 
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(asset);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPrompt(asset.prompt);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Asset Detail Modal */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {selectedAsset.type === 'image' ? (
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                ) : (
                  <Video className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Prompt</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {selectedAsset.prompt}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Created {selectedAsset.timestamp.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleLike(selectedAsset.id)}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${selectedAsset.liked ? 'fill-current text-red-500' : ''}`} />
                    {selectedAsset.liked ? 'Liked' : 'Like'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopyPrompt(selectedAsset.prompt)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Prompt
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={() => handleDownload(selectedAsset)}
                  >
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