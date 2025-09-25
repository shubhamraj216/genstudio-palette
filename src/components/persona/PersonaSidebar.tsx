import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  X,
  Plus,
  Check,
  Trash2,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Persona = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

interface PersonaSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  onPersonaChanged?: () => void; // optional callback so parent can react
}

const API_BASE = "http://python-genai.railway.internal";
const TOKEN_KEY = "access_token";

export default function PersonaSidebar({ isOpen, onClose, isMobile, onPersonaChanged }: PersonaSidebarProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const { toast } = useToast();

  const [newPersona, setNewPersona] = useState({
    name: "",
    description: "",
    icon: "🎯",
    tags: [] as string[],
    tagInput: "",
  });

  const authHeader = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPersonas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/personas`, {
        headers: { "Content-Type": "application/json", ...authHeader() },
      });
      if (!res.ok) {
        throw new Error(`failed (${res.status})`);
      }
      const data = await res.json();
      setPersonas(data.personas || []);
    } catch (err) {
      console.warn("fetchPersonas error", err);
      toast({ title: "Error", description: "Could not load personas." });
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchPersonas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAddTag = () => {
    if (!newPersona.tagInput.trim()) return;
    if (!newPersona.tags.includes(newPersona.tagInput.trim())) {
      setNewPersona(prev => ({ ...prev, tags: [...prev.tags, prev.tagInput.trim()], tagInput: "" }));
    } else {
      setNewPersona(prev => ({ ...prev, tagInput: "" }));
    }
  };

  const handleRemoveTag = (t: string) => {
    setNewPersona(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== t) }));
  };

  const createPersona = async () => {
    if (!newPersona.name.trim()) {
      toast({ title: "Name required", description: "Persona name is required", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        name: newPersona.name,
        description: newPersona.description,
        icon: newPersona.icon,
        tags: newPersona.tags,
      };
      const res = await fetch(`${API_BASE}/api/personas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "create failed");
      }
      const created = await res.json();
      setPersonas(prev => [created, ...prev]);
      setShowCreateModal(false);
      setNewPersona({ name: "", description: "", icon: "🎯", tags: [], tagInput: "" });
      toast({ title: "Created", description: `${created.name} created` });
      onPersonaChanged?.();
    } catch (err) {
      console.warn("createPersona error", err);
      toast({ title: "Error", description: "Could not create persona" });
    }
  };

  const startEditPersona = (p: Persona) => {
    setEditingPersona(p);
  };

  const saveEditPersona = async () => {
    if (!editingPersona) return;
    try {
      const payload = {
        name: editingPersona.name,
        description: editingPersona.description,
        icon: editingPersona.icon,
        tags: editingPersona.tags,
      };
      const res = await fetch(`${API_BASE}/api/personas/${editingPersona.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "update failed");
      }
      const updated = await res.json();
      setPersonas(prev => prev.map(x => (x.id === updated.id ? updated : x)));
      setEditingPersona(null);
      toast({ title: "Saved", description: `${updated.name} updated` });
      onPersonaChanged?.();
    } catch (err) {
      console.warn("saveEditPersona error", err);
      toast({ title: "Error", description: "Could not update persona" });
    }
  };

  const deletePersona = async (id: string) => {
    if (personas.length <= 1) {
      toast({ title: "Cannot delete", description: "You must have at least one persona", variant: "destructive" });
      return;
    }
    if (!confirm("Delete persona? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/personas/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeader() },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "delete failed");
      }
      await res.json();
      setPersonas(prev => prev.filter(p => p.id !== id));
      toast({ title: "Deleted", description: "Persona removed" });
      onPersonaChanged?.();
    } catch (err) {
      console.warn("deletePersona error", err);
      toast({ title: "Error", description: "Could not delete persona" });
    }
  };

  const activate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/personas/${id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "activate failed");
      }
      const updated = await res.json();
      // reload list to get consistent ordering/flags
      await fetchPersonas();
      toast({ title: "Activated", description: `${updated.name} is now active.` });
      onPersonaChanged?.();
    } catch (err) {
      console.warn("activate error", err);
      toast({ title: "Error", description: "Could not activate persona" });
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-lg font-semibold">Personas</h2>
          <p className="text-sm text-muted-foreground">Manage your creative styles</p>
        </div>
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : personas.length === 0 ? (
          <div className="text-sm text-muted-foreground">No personas yet</div>
        ) : (
          <div className="space-y-4">
            {personas.map((persona) => (
              <Card
                key={persona.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-soft ${persona.is_active ? "ring-2 ring-primary bg-primary/5" : ""}`}
                onClick={() => activate(persona.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{persona.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{persona.name}</h3>
                      {persona.is_active && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          <Check className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {persona.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {persona.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {persona.tags && persona.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{persona.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditPersona(persona);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePersona(persona.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="border-t p-6">
        <Button onClick={() => setShowCreateModal(true)} className="w-full" variant="gradient">
          <Plus className="mr-2 h-4 w-4" />
          Create New Persona
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={onClose}>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader className="pb-4">
              <SheetTitle>Personas</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      ) : (
        <>
          {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}
          <div
            className={`fixed right-0 top-0 h-full w-96 bg-background border-l shadow-large z-50 transform transition-transform duration-300 ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {sidebarContent}
          </div>
        </>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Persona</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personaName">Name</Label>
              <Input id="personaName" value={newPersona.name} onChange={(e) => setNewPersona(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Minimalist Designer" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personaDescription">Description</Label>
              <Textarea id="personaDescription" value={newPersona.description} onChange={(e) => setNewPersona(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe the style and characteristics..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personaIcon">Icon</Label>
              <div className="flex items-center gap-2">
                <span className="text-2xl p-2 border rounded">{newPersona.icon}</span>
                <Input id="personaIcon" value={newPersona.icon} onChange={(e) => setNewPersona(prev => ({ ...prev, icon: e.target.value }))} placeholder="🎯" className="flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personaTags">Style Tags</Label>
              <div className="flex gap-2">
                <Input id="personaTags" value={newPersona.tagInput} onChange={(e) => setNewPersona(prev => ({ ...prev, tagInput: e.target.value }))} placeholder="Add a tag..." onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())} className="flex-1" />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>

              {newPersona.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newPersona.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-transparent" onClick={() => handleRemoveTag(tag)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
              <Button variant="gradient" onClick={createPersona} className="flex-1">Create Persona</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Persona Dialog */}
      <Dialog open={!!editingPersona} onOpenChange={() => setEditingPersona(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Persona</DialogTitle>
          </DialogHeader>

          {editingPersona && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editingPersona.name} onChange={(e) => setEditingPersona({ ...editingPersona, name: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editingPersona.description} onChange={(e) => setEditingPersona({ ...editingPersona, description: e.target.value })} rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <Input value={editingPersona.icon} onChange={(e) => setEditingPersona({ ...editingPersona, icon: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={(editingPersona.tags || []).join(", ")} onChange={(e) => setEditingPersona({ ...editingPersona, tags: e.target.value.split(",").map(t=>t.trim()).filter(Boolean) })} />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditingPersona(null)} className="flex-1">Cancel</Button>
                <Button variant="gradient" onClick={saveEditPersona} className="flex-1">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
