// src/components/views/ChatView.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, GENERATION_ENDPOINTS, CONVERSATION_ENDPOINTS, ASSET_ENDPOINTS, AVATAR_ENDPOINTS } from "@/config/api";
import {
  Send,
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Wand2,
  Bot,
  User,
  UserCircle,
  Download,
  Heart,
  ChevronDown,
  Settings,
  MessageSquare,
  X,
  Zap,
  Film,
  Play,
  Edit,
  Clapperboard,
} from "lucide-react";

type GenerationMode = "auto" | "text" | "image" | "video" | "plan";
type VideoSubMode = "text_to_video" | "frames_to_video" | "references_to_video" | "extend_video";

interface UploadedImage {
  id: string;
  mime_type: string;
  data: string; // base64
  preview: string; // data URL for preview
  label?: string; // e.g., "Start Frame", "End Frame", "Reference 1"
}

interface Avatar {
  id: string;
  name: string;
  url: string;
  is_default: boolean;
}

interface VideoParams {
  model: 
    | "veo-2.0-generate-001"
    | "veo-3.0-generate-001"
    | "veo-3.0-fast-generate-001"
    | "veo-3.1-generate-preview" 
    | "veo-3.1-fast-generate-preview";
  aspect_ratio: "16:9" | "9:16";
  resolution: "720p" | "1080p";
}

interface Scene {
  id: string;
  description: string;
  prompt: string;
  mode: "text_to_video" | "frames_to_video" | "references_to_video" | "extend_video";
  duration_hint: string;
  pre_generate_images: boolean;
  image_prompts?: string[] | null;
  dependencies: string[];
  reasoning: string;
  aspect_ratio?: "16:9" | "9:16";
  resolution?: "720p" | "1080p";
  model?: 
    | "veo-2.0-generate-001"
    | "veo-3.0-generate-001"
    | "veo-3.0-fast-generate-001"
    | "veo-3.1-generate-preview" 
    | "veo-3.1-fast-generate-preview";
}

interface ExecutionPlan {
  scenes: Scene[];
  orchestration: {
    parallel_groups: string[][];
    sequential_chains: string[][];
  };
  overall_strategy: string;
  estimated_duration: string;
  created_at: string;
  script_hash: string;
}

interface SceneResult {
  scene_id: string;
  success: boolean;
  video_url?: string;
  video_uri?: string;
  generated_images?: Array<{
    id: string;
    type: string;
    url: string;
  }> | null;
  error?: string | null;
  duration_seconds?: number;
  cost?: {
    prompt_cost: number;
    completion_cost: number;
    total_cost: number;
    currency: string;
  };
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  assets?: Array<{
    id: string;
    type: "image" | "video" | string;
    url: string;
    uri?: string; // for video extension
    prompt?: string;
    liked?: boolean;
    scene_id?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: {
    total_cost: number;
    currency: string;
  };
  execution_plan?: ExecutionPlan;
  scene_results?: SceneResult[];
}

interface SessionCost {
  total_cost: number;
  total_tokens: number;
  currency: string;
}

interface ChatViewProps {
  chatId?: string;
  onNewChat?: (backendConversationId?: string) => void;
}

export default function ChatView({ chatId, onNewChat }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm your AI assistant for creating amazing visual assets. Choose a mode and describe what you'd like me to generate.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>("auto");
  const [videoSubMode, setVideoSubMode] = useState<VideoSubMode>("text_to_video");
  const [videoParams, setVideoParams] = useState<VideoParams>({
    model: "veo-3.1-fast-generate-preview",
    aspect_ratio: "16:9",
    resolution: "720p",
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [sessionCost, setSessionCost] = useState<SessionCost | null>(null);
  const [videoSettingsOpen, setVideoSettingsOpen] = useState(false);
  const [extendVideoUri, setExtendVideoUri] = useState<string | null>(null);
  const [currentExecutionPlan, setCurrentExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false);
  const [editedPlan, setEditedPlan] = useState<ExecutionPlan | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [avatarSearchQuery, setAvatarSearchQuery] = useState("");
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickPrompts = [
    { text: "A futuristic city skyline at sunset", mode: "image" as GenerationMode },
    { text: "Explain quantum computing in simple terms", mode: "text" as GenerationMode },
    { text: "A cat playing with a ball of yarn", mode: "video" as GenerationMode },
    { text: "Abstract geometric pattern in blue and gold", mode: "auto" as GenerationMode },
  ];

  function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Fetch avatars for selection
  const fetchAvatars = useCallback(async () => {
    try {
      const res = await fetch(AVATAR_ENDPOINTS.LIST, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      if (!res.ok) return;
      const data = await res.json();
      const parsed: Avatar[] = (data.avatars || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        url: a.url.startsWith("http") ? a.url : `${API_BASE_URL}${a.url}`,
        is_default: !!a.is_default,
      }));
      setAvatars(parsed);
    } catch (err) {
      console.error("Failed to fetch avatars", err);
    }
  }, []);

  const getModeIcon = (m: GenerationMode) => {
    switch (m) {
      case "text":
        return <MessageSquare className="h-4 w-4" />;
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "video":
        return <VideoIcon className="h-4 w-4" />;
      case "plan":
        return <Clapperboard className="h-4 w-4" />;
      case "auto":
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getModeLabel = (m: GenerationMode) => {
    switch (m) {
      case "text":
        return "Text";
      case "image":
        return "Image";
      case "video":
        return "Video";
      case "plan":
        return "Plan";
      case "auto":
      default:
        return "Auto";
    }
  };

  // Helper function to check if current model supports advanced features
  const isVeo31Model = (model: string) => {
    return model === "veo-3.1-generate-preview" || model === "veo-3.1-fast-generate-preview";
  };

  const supportsAvatars = (model: string) => {
    // Avatar is only supported by veo 3.1 models (not 2.0 or 3.0)
    return isVeo31Model(model);
  };

  const getPlaceholder = (m: GenerationMode, subMode?: VideoSubMode) => {
    if (m === "video") {
      switch (subMode) {
        case "frames_to_video":
          return "Describe the transition between frames...";
        case "references_to_video":
          return "Describe the video using the reference images...";
        case "extend_video":
          return "Continue the video with...";
        default:
          return "Describe the video you want to create...";
      }
    }
    switch (m) {
      case "text":
        return "Ask me anything or describe what you need...";
      case "image":
        return "Describe the image you want to create...";
      case "plan":
        return "Enter your narrative script for multi-scene video generation...";
      case "auto":
      default:
        return "Describe what you want to create...";
    }
  };

  const getVideoSubModeLabel = (subMode: VideoSubMode) => {
    switch (subMode) {
      case "text_to_video":
        return "Text to Video";
      case "frames_to_video":
        return "Frames to Video";
      case "references_to_video":
        return "References to Video";
      case "extend_video":
        return "Extend Video";
      default:
        return "Text to Video";
    }
  };

  // Fetch conversation messages when chatId changes
  useEffect(() => {
    const fetchConversation = async (cid: string) => {
      setLoading(true);
      try {
        const res = await fetch(CONVERSATION_ENDPOINTS.GET(cid), {
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        });
        if (!res.ok) {
          console.warn("failed to fetch conversation", res.status);
          setMessages([]);
          setLoading(false);
          return;
        }
        const conv = await res.json();
        const parsed: Message[] = (conv.messages || []).map((m: any) => ({
          id: m.id,
          type: m.role === "user" ? "user" : "assistant",
          content: m.content,
          timestamp: new Date(m.timestamp),
          assets: m.assets?.map((a: any) => ({
            id: a.id,
            type: a.type,
            url: a.url.startsWith("http") ? a.url : `${API_BASE_URL}${a.url}`,
            uri: a.uri,
            prompt: a.prompt,
            liked: !!a.liked,
            scene_id: a.scene_id,
          })),
          usage: m.usage,
          cost: m.cost,
          execution_plan: m.execution_plan,
          scene_results: m.scene_results,
        }));
        setMessages(parsed.length ? parsed : []);
        
        // Extract session cost if available
        if (conv.session_cost) {
          setSessionCost(conv.session_cost);
        }
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
      setMessages([
        {
          id: "1",
          type: "assistant",
          content:
            "Hello! I'm your AI assistant for creating amazing visual assets. Choose a mode and describe what you'd like me to generate.",
          timestamp: new Date(),
        },
      ]);
      setSessionCost(null);
    }
  }, [chatId]);

  // Fetch avatars when avatar modal opens
  useEffect(() => {
    if (avatarModalOpen) {
      fetchAvatars();
    }
  }, [avatarModalOpen, fetchAvatars]);

  // Reset video sub-mode if switching to a non-3.1 model that doesn't support it
  useEffect(() => {
    if (mode === "video" && !isVeo31Model(videoParams.model)) {
      if (videoSubMode === "frames_to_video" || videoSubMode === "references_to_video") {
        setVideoSubMode("text_to_video");
        setUploadedImages([]);
        toast({
          title: "Mode Changed",
          description: "Frames/References to Video is only available for Veo 3.1 models. Switched to Text to Video.",
        });
      }
    }
  }, [videoParams.model, mode, videoSubMode, toast]);

  // File upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxFiles = mode === "video" && videoSubMode === "references_to_video" ? 5 : 2;
    if (uploadedImages.length + files.length > maxFiles) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxFiles} images allowed for this mode.`,
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Only image files are allowed.",
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const base64Data = dataUrl.split(",")[1];
        
        let label = "";
        if (mode === "video" && videoSubMode === "frames_to_video") {
          label = uploadedImages.length === 0 ? "Start Frame" : "End Frame";
        } else if (mode === "video" && videoSubMode === "references_to_video") {
          label = `Reference ${uploadedImages.length + 1}`;
        }

        setUploadedImages((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}-${i}`,
            mime_type: file.type,
            data: base64Data,
            preview: dataUrl,
            label,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeUploadedImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleModeChange = (newMode: GenerationMode, subMode?: VideoSubMode) => {
    setMode(newMode);
    if (newMode === "video" && subMode) {
      setVideoSubMode(subMode);
    }
    // Clear uploaded images when changing modes
    setUploadedImages([]);
    setExtendVideoUri(null);
  };

  const handleExtendVideo = (videoUri: string) => {
    setMode("video");
    setVideoSubMode("extend_video");
    setExtendVideoUri(videoUri);
    setUploadedImages([]);
    toast({
      title: "Extend Video Mode",
      description: "Ready to extend the video. Describe what happens next!",
    });
  };

  const handleOpenEditPlan = (plan: ExecutionPlan) => {
    setEditedPlan(JSON.parse(JSON.stringify(plan))); // Deep copy
    setEditPlanModalOpen(true);
  };

  const handleBuildPlan = useCallback(async (plan: ExecutionPlan) => {
    setIsGenerating(true);
    setEditPlanModalOpen(false);

    try {
      const payload: any = {
        mode: "plan",
        prompt: "Execute plan",
        execution_plan: plan,
        conversation_id: chatId,
      };

      // Add avatar_id if selected
      if (selectedAvatar) {
        payload.avatar_id = selectedAvatar.id;
      }

      const res = await fetch(GENERATION_ENDPOINTS.GENERATE_UNIFIED, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("plan execution failed:", res.status, text);
        toast({ 
          title: "Plan Execution Failed", 
          description: text || "Server returned an error.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const data = await res.json();

      // Sync conversation id
      if (data.conversation_id && data.conversation_id !== chatId) {
        onNewChat?.(data.conversation_id);
      }

      // Build assistant message with results
      const msg = data.message;
      const parsed: Message = {
        id: msg.id,
        type: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        assets: msg.assets?.map((a: any) => ({
          id: a.id,
          type: a.type,
          url: a.url.startsWith("http") ? a.url : `${API_BASE_URL}${a.url}`,
          uri: a.uri,
          prompt: a.prompt,
          liked: !!a.liked,
          scene_id: a.scene_id,
        })),
        usage: data.usage,
        cost: data.cost,
        execution_plan: data.execution_plan,
        scene_results: data.scene_results,
      };

      setMessages((prev) => [...prev, parsed]);

      // Update session cost
      if (data.session_cost) {
        setSessionCost(data.session_cost);
      }

      toast({
        title: "Plan Executed!",
        description: `${data.scene_results?.filter((r: any) => r.success).length || 0} scenes generated successfully.`,
      });
    } catch (err) {
      console.error("plan execution error", err);
      toast({ 
        title: "Error", 
        description: "Could not execute plan. Check console.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setCurrentExecutionPlan(null);
    }
  }, [chatId, onNewChat, toast]);

  // Send / generate handler
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isGenerating) return;

    // Validation
    if (mode === "video" && videoSubMode === "frames_to_video" && uploadedImages.length !== 2) {
      toast({
        title: "Missing frames",
        description: "Please upload both start and end frames.",
        variant: "destructive",
      });
      return;
    }
    if (mode === "video" && videoSubMode === "references_to_video" && uploadedImages.length === 0) {
      toast({
        title: "Missing references",
        description: "Please upload at least one reference image.",
        variant: "destructive",
      });
      return;
    }
    if (mode === "video" && videoSubMode === "extend_video" && !extendVideoUri) {
      toast({
        title: "No video to extend",
        description: "Please select a video to extend.",
        variant: "destructive",
      });
      return;
    }

    const promptToSend = inputValue;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: promptToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsGenerating(true);

    try {
      // Build request payload based on mode
      const payload: any = {
        mode,
        prompt: promptToSend,
        conversation_id: chatId,
      };

      // Add avatar_id for non-text modes
      if (mode !== "text" && selectedAvatar) {
        payload.avatar_id = selectedAvatar.id;
      }

      // Handle plan mode
      if (mode === "plan") {
        payload.script = promptToSend;
      }

      // Add images for TEXT and IMAGE modes
      if ((mode === "text" || mode === "image" || mode === "auto") && uploadedImages.length > 0) {
        payload.images = uploadedImages.map((img) => ({
          mime_type: img.mime_type,
          data: img.data,
        }));
      }

      // Add video-specific parameters
      if (mode === "video") {
        payload.video_mode = videoSubMode;
        payload.model = videoParams.model;
        payload.aspect_ratio = videoParams.aspect_ratio;
        payload.resolution = videoParams.resolution;

        switch (videoSubMode) {
          case "frames_to_video":
            if (uploadedImages.length === 2) {
              payload.start_frame = {
                mime_type: uploadedImages[0].mime_type,
                data: uploadedImages[0].data,
              };
              payload.end_frame = {
                mime_type: uploadedImages[1].mime_type,
                data: uploadedImages[1].data,
              };
            }
            break;
          case "references_to_video":
            payload.reference_images = uploadedImages.map((img) => ({
              mime_type: img.mime_type,
              data: img.data,
            }));
            break;
          case "extend_video":
            if (extendVideoUri) {
              payload.input_video = { uri: extendVideoUri };
            }
            break;
        }
      }

      const res = await fetch(GENERATION_ENDPOINTS.GENERATE_UNIFIED, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("generation failed:", res.status, text);
        toast({ 
          title: "Generation failed", 
          description: text || "Server returned an error.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const data = await res.json();

      // Sync conversation id
      if (data.conversation_id && data.conversation_id !== chatId) {
        onNewChat?.(data.conversation_id);
      }

      // Build assistant message
      const msg = data.message;
      const parsed: Message = {
        id: msg.id,
        type: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        assets: msg.assets?.map((a: any) => ({
          id: a.id,
          type: a.type,
          url: a.url.startsWith("http") ? a.url : `${API_BASE_URL}${a.url}`,
          uri: a.uri,
          prompt: a.prompt,
          liked: !!a.liked,
          scene_id: a.scene_id,
        })),
        usage: data.usage,
        cost: data.cost,
        execution_plan: data.execution_plan,
        scene_results: data.scene_results,
      };

      setMessages((prev) => [...prev, parsed]);

      // Store execution plan if present
      if (data.execution_plan) {
        setCurrentExecutionPlan(data.execution_plan);
      }

      // Update session cost
      if (data.session_cost) {
        setSessionCost(data.session_cost);
      }

      // Clear uploaded images after successful generation
      setUploadedImages([]);
      setExtendVideoUri(null);
      
      // Reset to auto mode after video or plan generation
      if (mode === "video" || mode === "plan") {
        setMode("auto");
        setVideoSubMode("text_to_video");
      }

      toast({
        title: "Generated!",
        description: `${getModeLabel(data.mode || mode)} generated successfully.`,
      });
    } catch (err) {
      console.error("generate error", err);
      toast({ 
        title: "Error", 
        description: "Could not generate content. Check console.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [inputValue, isGenerating, chatId, mode, videoSubMode, videoParams, uploadedImages, extendVideoUri, onNewChat, toast]);

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
      const createRes = await fetch(ASSET_ENDPOINTS.CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) {
        const txt = await createRes.text();
        throw new Error(`create failed: ${createRes.status} ${txt}`);
      }
      const created = await createRes.json();

      const toggleRes = await fetch(ASSET_ENDPOINTS.TOGGLE_LIKE(assetId), {
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
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            assets: m.assets?.map((a) => (a.id === assetId ? { ...a, liked: false } : a)),
          }))
        );
        window.dispatchEvent(new CustomEvent("assets:changed", { detail: { id: assetId, deleted: true } }));
        return;
      }

      toast({ title: updated.liked ? "Added to Assets" : "Updated" });

      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          assets: m.assets?.map((a) => (a.id === assetId ? { ...a, liked: !!updated.liked } : a)),
        }))
      );

      window.dispatchEvent(new CustomEvent("assets:changed", { detail: updated || created }));
    } catch (err) {
      console.error("handleAddToAssets error", err);
      toast({ title: "Error", description: "Could not update asset.", variant: "destructive" });
    }
  };

  const handleDownload = (assetUrl: string, filename?: string) => {
    const a = document.createElement("a");
    a.href = assetUrl;
    a.download = filename || "";
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
      {/* Session Cost Header */}
      {sessionCost && sessionCost.total_cost > 0 && (
        <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm px-4 py-2">
          <div className="mx-auto max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>{sessionCost.total_tokens.toLocaleString()} tokens</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div>
                Session Cost: {sessionCost.currency} ${sessionCost.total_cost.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}

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
                    
                    {/* Execution Plan Display */}
                    {message.type === "assistant" && message.execution_plan && !message.scene_results && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <Badge variant="default" className="bg-gradient-primary">
                            <Film className="h-3 w-3 mr-1" />
                            Plan
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditPlan(message.execution_plan!)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Review/Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-gradient-primary"
                              onClick={() => handleBuildPlan(message.execution_plan!)}
                              disabled={isGenerating}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Build
                            </Button>
                          </div>
                        </div>

                        {/* Overall Strategy */}
                        <div className="text-xs text-muted-foreground">
                          <strong>Strategy:</strong> {message.execution_plan.overall_strategy}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <strong>Estimated Duration:</strong> {message.execution_plan.estimated_duration}
                        </div>

                        {/* Scenes */}
                        <div className="space-y-2">
                          {message.execution_plan.scenes.map((scene, idx) => (
                            <Card key={scene.id} className="p-3 bg-muted/50">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {scene.id}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {scene.mode.replace(/_/g, " ")}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {scene.duration_hint}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm mb-1">
                                <strong>Description:</strong> {scene.description}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <strong>Prompt:</strong> {scene.prompt}
                              </div>
                              {scene.dependencies.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  <strong>Depends on:</strong> {scene.dependencies.join(", ")}
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Cost and usage badges */}
                    {message.type === "assistant" && (message.usage || message.cost) && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                        {message.usage && (
                          <Badge variant="outline" className="text-xs">
                            {message.usage.total_tokens} tokens
                          </Badge>
                        )}
                        {message.cost && (
                          <Badge variant="outline" className="text-xs">
                            ${message.cost.total_cost.toFixed(6)}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Card>

                  {/* Generated Assets */}
                  {message.assets && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {message.assets.map((asset) => (
                        <Card
                          key={asset.id}
                          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => asset.type === "image" && setSelectedImage(asset.url)}
                        >
                          <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                            {asset.type === "image" ? (
                              <img
                                src={asset.url}
                                alt={asset.prompt ?? "generated image"}
                                loading="lazy"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            ) : asset.type === "video" ? (
                              <video
                                src={asset.url}
                                controls
                                className="w-full h-full object-cover"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <VideoIcon className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                          <div className="p-3">
                            {asset.scene_id && (
                              <Badge variant="secondary" className="text-xs mb-2">
                                {asset.scene_id}
                              </Badge>
                            )}
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              "{asset.prompt}"
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(asset.url, `${asset.id}.${asset.type === "video" ? "mp4" : "png"}`);
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
                              {asset.type === "video" && asset.uri && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-gradient-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExtendVideo(asset.uri!);
                                  }}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Extend
                                </Button>
                              )}
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

          {/* Loading indicator */}
          {isGenerating && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <Card className="p-4 bg-card">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Generating your {getModeLabel(mode).toLowerCase()}...
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
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
                    onClick={() => {
                      setInputValue(prompt.text);
                      setMode(prompt.mode);
                    }}
                    className="text-xs"
                  >
                    {getModeIcon(prompt.mode)}
                    <span className="ml-1">{prompt.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.preview}
                    alt={img.label || "uploaded"}
                    className="h-16 w-16 rounded-lg object-cover border-2 border-border"
                  />
                  {img.label && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] text-center py-0.5 rounded-b-lg">
                      {img.label}
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeUploadedImage(img.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Extend Video Indicator */}
          {extendVideoUri && (
            <div className="mb-3">
              <Badge variant="default" className="bg-gradient-primary">
                <Film className="h-3 w-3 mr-1" />
                Extending Video
              </Badge>
            </div>
          )}

          {/* Selected Avatar Display */}
          {selectedAvatar && mode !== "text" && (
            <div className="mb-3">
              <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-lg border border-border/50 rounded-lg p-2">
                <img
                  src={selectedAvatar.url}
                  alt={selectedAvatar.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="text-sm font-medium">{selectedAvatar.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-full"
                  onClick={() => setSelectedAvatar(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="relative flex items-center gap-2 bg-card/80 backdrop-blur-lg border border-border/50 rounded-2xl p-2 shadow-lg">
            {/* Mode Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-3 shrink-0">
                  {getModeIcon(mode)}
                  <span className="hidden sm:inline">{getModeLabel(mode)}</span>
                  {mode === "video" && (
                    <span className="hidden md:inline text-xs text-muted-foreground">
                      • {getVideoSubModeLabel(videoSubMode)}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Generation Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleModeChange("auto")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleModeChange("text")}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleModeChange("image")}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <VideoIcon className="h-4 w-4 mr-2" />
                    Video
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleModeChange("video", "text_to_video")}>
                      Text to Video
                    </DropdownMenuItem>
                    {isVeo31Model(videoParams.model) && (
                      <>
                        <DropdownMenuItem onClick={() => handleModeChange("video", "frames_to_video")}>
                          Frames to Video
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleModeChange("video", "references_to_video")}>
                          References to Video
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => handleModeChange("plan")}>
                  <Clapperboard className="h-4 w-4 mr-2" />
                  Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Avatar Selector Button (only for non-text modes and supported models) */}
            {mode !== "text" && (mode !== "video" || supportsAvatars(videoParams.model)) && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setAvatarModalOpen(true)}
                title="Select Avatar"
              >
                <UserCircle className="h-5 w-5" />
              </Button>
            )}

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={getPlaceholder(mode, videoSubMode)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isGenerating}
              className="flex-1 min-h-[48px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={mode === "video" && (videoSubMode === "references_to_video" || videoSubMode === "frames_to_video")}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Photo Upload Button */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || (mode === "video" && videoSubMode === "extend_video")}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>

            {/* Video Settings Button */}
            {mode === "video" && (
              <Dialog open={videoSettingsOpen} onOpenChange={setVideoSettingsOpen}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setVideoSettingsOpen(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Video Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Model</label>
                      <Select
                        value={videoParams.model}
                        onValueChange={(value: any) =>
                          setVideoParams((prev) => ({ ...prev, model: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="veo-2.0-generate-001">
                            Veo 2.0 Standard
                          </SelectItem>
                          <SelectItem value="veo-3.0-generate-001">
                            Veo 3.0 Standard
                          </SelectItem>
                          <SelectItem value="veo-3.0-fast-generate-001">
                            Veo 3.0 Fast
                          </SelectItem>
                          <SelectItem value="veo-3.1-generate-preview">
                            Veo 3.1 Standard (Preview)
                          </SelectItem>
                          <SelectItem value="veo-3.1-fast-generate-preview">
                            Veo 3.1 Fast (Preview)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Aspect Ratio</label>
                      <Select
                        value={videoParams.aspect_ratio}
                        onValueChange={(value: any) =>
                          setVideoParams((prev) => ({ ...prev, aspect_ratio: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Resolution</label>
                      <Select
                        value={videoParams.resolution}
                        onValueChange={(value: any) =>
                          setVideoParams((prev) => ({ ...prev, resolution: value }))
                        }
                        disabled={videoSubMode === "extend_video"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p</SelectItem>
                          <SelectItem value="1080p">1080p</SelectItem>
                        </SelectContent>
                      </Select>
                      {videoSubMode === "extend_video" && (
                        <p className="text-xs text-muted-foreground">
                          Resolution is fixed at 720p for video extension
                        </p>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isGenerating}
              variant="gradient"
              size="icon"
              className="shrink-0 rounded-full h-10 w-10"
            >
              {isGenerating ? (
                <Wand2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Plan Edit Modal */}
      <Dialog open={editPlanModalOpen} onOpenChange={setEditPlanModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Edit Execution Plan</span>
              <Button
                size="sm"
                variant="default"
                className="bg-gradient-primary"
                onClick={() => editedPlan && handleBuildPlan(editedPlan)}
                disabled={isGenerating}
              >
                <Play className="h-3 w-3 mr-1" />
                Build
              </Button>
            </DialogTitle>
          </DialogHeader>
          {editedPlan && (
            <div className="space-y-4 py-4">
              {/* Overall Strategy */}
              <div>
                <label className="text-sm font-medium">Overall Strategy</label>
                <p className="text-xs text-muted-foreground mt-1">
                  {editedPlan.overall_strategy}
                </p>
              </div>

              {/* Scenes */}
              <div className="space-y-4">
                <label className="text-sm font-medium">Scenes</label>
                {editedPlan.scenes.map((scene, idx) => (
                  <Card key={scene.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{scene.id}</Badge>
                      <Input
                        value={scene.duration_hint}
                        onChange={(e) => {
                          const updated = { ...editedPlan };
                          updated.scenes[idx].duration_hint = e.target.value;
                          setEditedPlan(updated);
                        }}
                        className="w-20 h-8 text-xs"
                        placeholder="5s"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium">Description</label>
                      <Textarea
                        value={scene.description}
                        onChange={(e) => {
                          const updated = { ...editedPlan };
                          updated.scenes[idx].description = e.target.value;
                          setEditedPlan(updated);
                        }}
                        className="mt-1 text-xs"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium">Prompt</label>
                      <Textarea
                        value={scene.prompt}
                        onChange={(e) => {
                          const updated = { ...editedPlan };
                          updated.scenes[idx].prompt = e.target.value;
                          setEditedPlan(updated);
                        }}
                        className="mt-1 text-xs"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium">Mode</label>
                        <Select
                          value={scene.mode}
                          onValueChange={(value: any) => {
                            const updated = { ...editedPlan };
                            updated.scenes[idx].mode = value;
                            setEditedPlan(updated);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text_to_video">Text to Video</SelectItem>
                            {isVeo31Model(scene.model || "veo-3.1-fast-generate-preview") && (
                              <>
                                <SelectItem value="frames_to_video">Frames to Video</SelectItem>
                                <SelectItem value="references_to_video">References to Video</SelectItem>
                              </>
                            )}
                            <SelectItem value="extend_video">Extend Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium">Model</label>
                        <Select
                          value={scene.model || "veo-3.1-fast-generate-preview"}
                          onValueChange={(value: any) => {
                            const updated = { ...editedPlan };
                            updated.scenes[idx].model = value;
                            // If switching to non-3.1 model and mode is frames/references, switch to text_to_video
                            if (!isVeo31Model(value) && 
                                (scene.mode === "frames_to_video" || scene.mode === "references_to_video")) {
                              updated.scenes[idx].mode = "text_to_video";
                            }
                            setEditedPlan(updated);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="veo-2.0-generate-001">Veo 2.0 Standard</SelectItem>
                            <SelectItem value="veo-3.0-generate-001">Veo 3.0 Standard</SelectItem>
                            <SelectItem value="veo-3.0-fast-generate-001">Veo 3.0 Fast</SelectItem>
                            <SelectItem value="veo-3.1-generate-preview">Veo 3.1 Standard (Preview)</SelectItem>
                            <SelectItem value="veo-3.1-fast-generate-preview">Veo 3.1 Fast (Preview)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium">Aspect Ratio</label>
                        <Select
                          value={scene.aspect_ratio || "16:9"}
                          onValueChange={(value: any) => {
                            const updated = { ...editedPlan };
                            updated.scenes[idx].aspect_ratio = value;
                            setEditedPlan(updated);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9">16:9</SelectItem>
                            <SelectItem value="9:16">9:16</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs font-medium">Resolution</label>
                        <Select
                          value={scene.resolution || "720p"}
                          onValueChange={(value: any) => {
                            const updated = { ...editedPlan };
                            updated.scenes[idx].resolution = value;
                            setEditedPlan(updated);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="720p">720p</SelectItem>
                            <SelectItem value="1080p">1080p</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {scene.dependencies.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Dependencies:</strong> {scene.dependencies.join(", ")}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-gradient-primary"
              onClick={() => editedPlan && handleBuildPlan(editedPlan)}
              disabled={isGenerating}
            >
              <Play className="h-4 w-4 mr-2" />
              Build Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Generated Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="p-6">
              <div className="aspect-video bg-muted flex items-center justify-center mb-4 rounded-lg overflow-hidden">
                <img src={selectedImage} alt="generated" className="max-h-[70vh] object-contain" />
              </div>
              <div className="flex items-center justify-between">
                <Button variant="gradient" onClick={() => handleDownload(selectedImage, undefined)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Avatar Selection Modal */}
      <Dialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Avatar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Input
                value={avatarSearchQuery}
                onChange={(e) => setAvatarSearchQuery(e.target.value)}
                placeholder="Search avatars..."
                className="pl-10"
              />
              <MessageSquare className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Avatars Grid */}
            {avatars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No avatars yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Go to the Avatars tab to upload your first avatar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {avatars
                  .filter(avatar => 
                    avatar.name.toLowerCase().includes(avatarSearchQuery.toLowerCase())
                  )
                  .map((avatar) => (
                    <div
                      key={avatar.id}
                      className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-md ${
                        selectedAvatar?.id === avatar.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => {
                        setSelectedAvatar(avatar);
                        setAvatarModalOpen(false);
                        setAvatarSearchQuery("");
                      }}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden mb-2">
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium text-center truncate">
                        {avatar.name}
                      </p>
                      {avatar.is_default && (
                        <Badge className="absolute top-1 right-1 text-[10px] px-1 py-0">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAvatarModalOpen(false);
                setAvatarSearchQuery("");
              }}
            >
              Cancel
            </Button>
            {selectedAvatar && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAvatar(null);
                  setAvatarModalOpen(false);
                  setAvatarSearchQuery("");
                }}
              >
                Clear Selection
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
