// src/components/views/ProfileView.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
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
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type Asset = {
  id: string;
  type: "image" | "video" | string;
  url: string;
  prompt: string;
  timestamp: string; // ISO
  liked?: boolean;
  downloads?: number;
};

export default function ProfileView() {
  const { toast } = useToast();
  const { user, authHeaders } = useAuth();

  const [activeTab, setActiveTab] = useState<"liked" | "downloaded" | "history">("liked");
  const [loading, setLoading] = useState<boolean>(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0); // bump to retry manually

  const BACKEND_BASE =  "https://python-genai.railway.internal";

  // Fetch assets once when user becomes available (or when retry requested)
  useEffect(() => {
    if (!user) {
      // If user is not present, still attempt to fetch assets (for guest flows),
      // but do not hammer the server — only when component mounts or retryKey changes.
      // You can comment this out if assets must be behind auth.
    }
    let aborted = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_BASE}/api/assets`, {
          headers: { "Content-Type": "application/json", ...(typeof authHeaders === "function" ? authHeaders() : authHeaders || {}) },
          signal: controller.signal,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Failed to fetch assets (${res.status})`);
        }
        const data = await res.json();
        const arr: Asset[] = Array.isArray(data) ? data : data.assets ?? [];
        const normalized = arr.map((a: any) => ({
          id: a.id,
          type: a.type,
          url: a.url,
          prompt: a.prompt || "",
          timestamp: a.timestamp || new Date().toISOString(),
          liked: !!a.liked,
          downloads: Number(a.downloads ?? 0),
        }));
        if (!aborted) setAssets(normalized);
      } catch (err: unknown) {
        if ((err as any)?.name === "AbortError") {
          // aborted — ignore
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("fetchAssets error", err);
          setError(msg);
          toast({ title: "Error", description: "Could not load assets." });
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();

    return () => {
      aborted = true;
      controller.abort();
    };
    // only re-run when user or retryKey changes
  }, [BACKEND_BASE, user, retryKey, authHeaders, toast]);

  // derived lists
  const likedAssets = useMemo(() => assets.filter((a) => a.liked), [assets]);
  const downloadedAssets = useMemo(() => assets.filter((a) => Number(a.downloads || 0) > 0), [assets]);
  const recentHistory = useMemo(() => [...assets].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)), [assets]);

  const generationsToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return assets.reduce((c, a) => (a.timestamp.slice(0, 10) === today ? c + 1 : c), 0);
  }, [assets]);

  const usageStats = {
    generationsToday,
    dailyLimit: 25,
    totalAssets: assets.length,
    totalDownloads: assets.reduce((s, a) => s + (Number(a.downloads) || 0), 0),
  };

  // Toggle like endpoint
  const handleToggleLike = async (assetId: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/assets/${encodeURIComponent(assetId)}/toggle-like`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(typeof authHeaders === "function" ? authHeaders() : authHeaders || {}) },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to toggle like (${res.status})`);
      }
      // refresh assets list
      setRetryKey((k) => k + 1);
      toast({ title: "Updated", description: "Asset like updated." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("toggle-like error", err);
      toast({ title: "Error", description: msg });
    }
  };

  // Increment download and trigger browser download
  const handleDownloadAgain = async (asset: Asset) => {
    try {
      const absUrl = asset.url.startsWith("http") ? asset.url : `${BACKEND_BASE}${asset.url}`;
      const res = await fetch(`${BACKEND_BASE}/api/assets/${encodeURIComponent(asset.id)}/increment-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(typeof authHeaders === "function" ? authHeaders() : authHeaders || {}) },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to record download (${res.status})`);
      }
      // refresh assets
      setRetryKey((k) => k + 1);

      // download
      const a = document.createElement("a");
      a.href = absUrl;
      a.download = asset.id;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast({ title: "Downloaded", description: "Asset download started." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("download error", err);
      toast({ title: "Error", description: msg });
    }
  };

  const handleView = (asset: Asset) => {
    const absUrl = asset.url.startsWith("http") ? asset.url : `${BACKEND_BASE}${asset.url}`;
    window.open(absUrl, "_blank", "noopener,noreferrer");
  };

  const displayName = useMemo(() => {
    if (!user) return "Guest";
    const first = (user.first_name || "").trim();
    const last = (user.last_name || "").trim();
    return (first || last) ? `${first} ${last}`.trim() : user.email;
  }, [user]);

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user ? "/placeholder.svg" : "/placeholder.svg"} alt={displayName} />
              <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                {displayName.split(" ").map((n) => n[0] ?? "").join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-semibold">{displayName}</h1>
                    <Badge variant="secondary" className="bg-gradient-accent invisible">
                      <Crown className="mr-1 h-3 w-3" />
                      Pro
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{user?.email ?? ""}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Calendar className="inline mr-1 h-3 w-3" />
                    Member since —
                  </p>
                </div>

                {/*<Button variant="outline" size="sm">*/}
                {/*  <Settings className="mr-2 h-4 w-4" />*/}
                {/*  Settings*/}
                {/*</Button>*/}
              </div>
            </div>
          </div>
        </Card>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Today's Usage</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{usageStats.generationsToday}</span>
                <span className="text-sm text-muted-foreground">/ {usageStats.dailyLimit}</span>
              </div>
              <Progress value={(usageStats.generationsToday / usageStats.dailyLimit) * 100} className="h-2" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Assets</span>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">{usageStats.totalAssets}</span>
          </Card>

          {/*<Card className="p-4">*/}
          {/*  <div className="flex items-center justify-between mb-2">*/}
          {/*    <span className="text-sm font-medium">Downloads</span>*/}
          {/*    <Download className="h-4 w-4 text-muted-foreground" />*/}
          {/*  </div>*/}
          {/*  <span className="text-2xl font-bold">{usageStats.totalDownloads}</span>*/}
          {/*</Card>*/}

          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Liked</span>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">{likedAssets.length}</span>
          </Card>
        </div>

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="liked" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Liked ({likedAssets.length})
              </TabsTrigger>
              {/*<TabsTrigger value="downloaded" className="flex items-center gap-2">*/}
              {/*  <Download className="h-4 w-4" />*/}
              {/*  Downloaded ({downloadedAssets.length})*/}
              {/*</TabsTrigger>*/}
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History ({recentHistory.length})
              </TabsTrigger>
            </TabsList>

            {/* show retry if there was an error */}
            {error && (
              <div className="p-6">
                <p className="text-sm text-destructive mb-4">Failed to load assets: {error}</p>
                <div className="flex gap-2">
                  <Button onClick={() => setRetryKey((k) => k + 1)}>Retry</Button>
                </div>
              </div>
            )}

            <TabsContent value="liked" className="mt-6">
              {!loading && likedAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No liked assets yet</h3>
                  <p className="text-muted-foreground">Heart assets in the chat or assets view to see them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {likedAssets.map((asset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                        {asset.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={asset.url.startsWith("http") ? asset.url : `${BACKEND_BASE}${asset.url}`} alt={asset.prompt} className="w-full h-full object-cover" />
                        ) : (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm line-clamp-2 mb-2">{asset.prompt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{new Date(asset.timestamp).toLocaleDateString()}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleLike(asset.id)}>Remove</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="downloaded" className="mt-6">
              {!loading && downloadedAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Download className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No downloads yet</h3>
                  <p className="text-muted-foreground">Download assets to see them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {downloadedAssets.map((asset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                        {asset.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={asset.url.startsWith("http") ? asset.url : `${BACKEND_BASE}${asset.url}`} alt={asset.prompt} className="w-full h-full object-cover" />
                        ) : (
                          <Video className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm line-clamp-2 mb-2">{asset.prompt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{new Date(asset.timestamp).toLocaleDateString()}</span>
                          <Button variant="outline" size="sm" onClick={() => handleDownloadAgain(asset)}>Download Again</Button>
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
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                        {asset.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={asset.url.startsWith("http") ? asset.url : `${BACKEND_BASE}${asset.url}`} alt={asset.prompt} className="w-full h-full object-cover" />
                        ) : (
                          <Video className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{asset.prompt}</p>
                        <p className="text-sm text-muted-foreground">{new Date(asset.timestamp).toLocaleDateString()} • {asset.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(asset)}>View</Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadAgain(asset)}>Download</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-6 bg-gradient-subtle">
          <div className="text-center">
            <Crown className="h-12 w-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
            <p className="text-muted-foreground mb-4">Unlimited generations, higher quality outputs, and priority processing.</p>
            <Button variant="gradient" size="lg">Upgrade Now</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
