import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search,
  Upload,
  Grid3X3,
  List,
  Star,
  Trash2,
  Edit2,
  X,
  Tag as TagIcon,
  UserCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, AVATAR_ENDPOINTS } from "@/config/api";

interface Avatar {
  id: string;
  owner_id: string;
  name: string;
  file_path: string;
  url: string;
  mime_type: string;
  created_at: string;
  is_default: boolean;
  tags?: string[];
}

export default function AvatarsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [avatarToDelete, setAvatarToDelete] = useState<Avatar | null>(null);
  const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvatars();
  }, []);

  function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  const fetchAvatars = async () => {
    setLoading(true);
    try {
      const res = await fetch(AVATAR_ENDPOINTS.LIST, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      if (!res.ok) throw new Error("Failed to fetch avatars");
      const data = await res.json();
      const parsed: Avatar[] = (data.avatars || []).map((a: any) => ({
        id: a.id,
        owner_id: a.owner_id,
        name: a.name,
        file_path: a.file_path,
        url: a.url.startsWith("http") ? a.url : `${API_BASE_URL}${a.url}`,
        mime_type: a.mime_type,
        created_at: a.created_at,
        is_default: !!a.is_default,
        tags: a.tags || [],
      }));
      setAvatars(parsed);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not load avatars." });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Error", description: "Please select an image file." });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 10MB." });
        return;
      }
      setUploadFile(file);
      setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) {
      toast({ title: "Error", description: "Please provide a file and name." });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadName.trim());
      if (uploadTags.length > 0) {
        formData.append("tags", JSON.stringify(uploadTags));
      }

      const res = await fetch(AVATAR_ENDPOINTS.UPLOAD, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      toast({ title: "Success", description: "Avatar uploaded successfully." });
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadName("");
      setUploadTags([]);
      await fetchAvatars();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not upload avatar." });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (avatar: Avatar) => {
    try {
      const res = await fetch(AVATAR_ENDPOINTS.DELETE(avatar.id), {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });

      if (!res.ok) throw new Error("Delete failed");

      toast({ title: "Success", description: "Avatar deleted successfully." });
      setDeleteDialogOpen(false);
      setAvatarToDelete(null);
      await fetchAvatars();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not delete avatar." });
    }
  };

  const handleSetDefault = async (avatarId: string) => {
    try {
      const res = await fetch(AVATAR_ENDPOINTS.SET_DEFAULT(avatarId), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });

      if (!res.ok) throw new Error("Set default failed");

      toast({ title: "Success", description: "Default avatar updated." });
      await fetchAvatars();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not set default avatar." });
    }
  };

  const handleStartEdit = (avatar: Avatar) => {
    setEditingAvatarId(avatar.id);
    setEditName(avatar.name);
    setEditTags(avatar.tags || []);
  };

  const handleSaveEdit = async (avatarId: string) => {
    try {
      const res = await fetch(AVATAR_ENDPOINTS.GET(avatarId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ name: editName, tags: editTags }),
      });

      if (!res.ok) throw new Error("Update failed");

      toast({ title: "Success", description: "Avatar updated successfully." });
      setEditingAvatarId(null);
      await fetchAvatars();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not update avatar." });
    }
  };

  const handleCancelEdit = () => {
    setEditingAvatarId(null);
    setEditName("");
    setEditTags([]);
  };

  const addTagToUpload = () => {
    if (newTag.trim() && !uploadTags.includes(newTag.trim())) {
      setUploadTags([...uploadTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTagFromUpload = (tag: string) => {
    setUploadTags(uploadTags.filter(t => t !== tag));
  };

  const addTagToEdit = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTagFromEdit = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  const toggleTagFilter = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Get all unique tags from avatars
  const allTags = Array.from(new Set(avatars.flatMap(a => a.tags || [])));

  const filteredAvatars = avatars.filter(avatar => {
    const matchesSearch = avatar.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => avatar.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Your Avatars</h1>
              <p className="text-sm text-muted-foreground">
                {filteredAvatars.length} avatar{filteredAvatars.length !== 1 ? 's' : ''} available
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="gradient"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Avatar
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
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

          {/* Search and Tag Filters */}
          <div className="mt-4 flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search avatars..."
                className="pl-10"
              />
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTagFilter(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTags([])}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatars Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="flex justify-center py-12">Loading...</div>
          ) : filteredAvatars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No avatars yet</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                Upload an avatar to maintain character consistency across your generations.
              </p>
              <Button variant="gradient" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Avatar
              </Button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                : "space-y-4"
            }>
              {filteredAvatars.map((avatar) => (
                <Card
                  key={avatar.id}
                  className={`overflow-hidden transition-all hover:shadow-medium ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  <div
                    className={`relative ${
                      viewMode === 'list' ? 'w-24 h-24' : 'aspect-square'
                    } bg-muted flex items-center justify-center overflow-hidden cursor-pointer`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    />
                    {avatar.is_default && (
                      <Badge
                        className="absolute top-2 right-2 text-xs bg-yellow-500"
                      >
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Default
                      </Badge>
                    )}
                  </div>

                  <div className="p-3 flex-1">
                    {editingAvatarId === avatar.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-sm"
                          autoFocus
                        />
                        <div className="flex flex-wrap gap-1">
                          {editTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer"
                                onClick={() => removeTagFromEdit(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTagToEdit()}
                            placeholder="Add tag..."
                            className="text-xs h-7"
                          />
                          <Button size="sm" onClick={addTagToEdit} className="h-7 px-2">
                            <TagIcon className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleSaveEdit(avatar.id)} className="flex-1">
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium line-clamp-2 mb-2">
                          {avatar.name}
                        </p>
                        {avatar.tags && avatar.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {avatar.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mb-3">
                          {new Date(avatar.created_at).toLocaleDateString()}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(avatar)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {!avatar.is_default && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(avatar.id)}
                              title="Set as default"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAvatarToDelete(avatar);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Avatar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {uploadFile && (
              <div className="aspect-square bg-muted flex items-center justify-center rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(uploadFile)}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Avatar Name</label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Enter avatar name..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tags (optional)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {uploadTags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeTagFromUpload(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTagToUpload()}
                  placeholder="Add tag..."
                />
                <Button onClick={addTagToUpload}>
                  <TagIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Avatar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{avatarToDelete?.name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => avatarToDelete && handleDelete(avatarToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Detail Modal */}
      <Dialog open={!!selectedAvatar} onOpenChange={() => setSelectedAvatar(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Avatar Details</DialogTitle>
          </DialogHeader>
          {selectedAvatar && (
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={selectedAvatar.url}
                  alt={selectedAvatar.name}
                  className="max-h-[60vh] object-contain"
                />
              </div>

              <div>
                <h3 className="font-medium mb-2">{selectedAvatar.name}</h3>
                {selectedAvatar.tags && selectedAvatar.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedAvatar.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Created {new Date(selectedAvatar.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center justify-between">
                {selectedAvatar.is_default ? (
                  <Badge className="bg-yellow-500">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Default Avatar
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleSetDefault(selectedAvatar.id)}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Set as Default
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    setAvatarToDelete(selectedAvatar);
                    setSelectedAvatar(null);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

