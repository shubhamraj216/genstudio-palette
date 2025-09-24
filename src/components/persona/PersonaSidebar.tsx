import { useState } from "react";
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
  Palette, 
  Camera, 
  Wand2,
  Trash2,
  Edit,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
}

interface PersonaSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function PersonaSidebar({ isOpen, onClose, isMobile }: PersonaSidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const { toast } = useToast();

  // Mock personas data
  const [personas, setPersonas] = useState<Persona[]>([
    {
      id: '1',
      name: 'Artistic Vision',
      description: 'Creates beautiful, artistic imagery with painterly effects',
      icon: '🎨',
      tags: ['artistic', 'painterly', 'creative'],
      isActive: true,
      createdAt: new Date(2024, 0, 1),
    },
    {
      id: '2',
      name: 'Tech Minimalist',
      description: 'Clean, modern designs with tech aesthetics',
      icon: '⚡',
      tags: ['minimal', 'tech', 'modern'],
      isActive: false,
      createdAt: new Date(2024, 0, 5),
    },
    {
      id: '3',
      name: 'Fantasy Realm',
      description: 'Magical and fantastical imagery with rich details',
      icon: '🧙‍♂️',
      tags: ['fantasy', 'magical', 'detailed'],
      isActive: false,
      createdAt: new Date(2024, 0, 10),
    },
  ]);

  const [newPersona, setNewPersona] = useState({
    name: '',
    description: '',
    icon: '🎯',
    tags: [] as string[],
    tagInput: '',
  });

  const handleSetActivePersona = (personaId: string) => {
    setPersonas(prev => prev.map(persona => ({
      ...persona,
      isActive: persona.id === personaId
    })));
    toast({
      title: "Persona Activated",
      description: "Your creative style has been updated.",
    });
  };

  const handleDeletePersona = (personaId: string) => {
    if (personas.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one persona.",
        variant: "destructive",
      });
      return;
    }
    
    setPersonas(prev => prev.filter(p => p.id !== personaId));
    toast({
      title: "Persona Deleted",
      description: "The persona has been removed.",
    });
  };

  const handleCreatePersona = () => {
    if (!newPersona.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your persona.",
        variant: "destructive",
      });
      return;
    }

    const persona: Persona = {
      id: Date.now().toString(),
      name: newPersona.name,
      description: newPersona.description,
      icon: newPersona.icon,
      tags: newPersona.tags,
      isActive: false,
      createdAt: new Date(),
    };

    setPersonas(prev => [...prev, persona]);
    setNewPersona({ name: '', description: '', icon: '🎯', tags: [], tagInput: '' });
    setShowCreateModal(false);
    
    toast({
      title: "Persona Created",
      description: `${persona.name} has been added to your collection.`,
    });
  };

  const handleAddTag = () => {
    if (newPersona.tagInput.trim() && !newPersona.tags.includes(newPersona.tagInput.trim())) {
      setNewPersona(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: '',
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewPersona(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
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

      {/* Personas List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {personas.map((persona) => (
            <Card 
              key={persona.id} 
              className={`p-4 cursor-pointer transition-all hover:shadow-soft ${
                persona.isActive ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleSetActivePersona(persona.id)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{persona.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{persona.name}</h3>
                    {persona.isActive && (
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
                    {persona.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {persona.tags.length > 3 && (
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
                      setEditingPersona(persona);
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
                      handleDeletePersona(persona.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-6">
        <Button 
          onClick={() => setShowCreateModal(true)} 
          className="w-full"
          variant="gradient"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Persona
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar */}
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
          {isOpen && (
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
          )}
          <div className={`fixed right-0 top-0 h-full w-96 bg-background border-l shadow-large z-50 transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {sidebarContent}
          </div>
        </>
      )}

      {/* Create Persona Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Persona</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personaName">Name</Label>
              <Input
                id="personaName"
                value={newPersona.name}
                onChange={(e) => setNewPersona(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Minimalist Designer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personaDescription">Description</Label>
              <Textarea
                id="personaDescription"
                value={newPersona.description}
                onChange={(e) => setNewPersona(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the style and characteristics..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personaIcon">Icon</Label>
              <div className="flex items-center gap-2">
                <span className="text-2xl p-2 border rounded">{newPersona.icon}</span>
                <Input
                  id="personaIcon"
                  value={newPersona.icon}
                  onChange={(e) => setNewPersona(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🎯"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personaTags">Style Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="personaTags"
                  value={newPersona.tagInput}
                  onChange={(e) => setNewPersona(prev => ({ ...prev, tagInput: e.target.value }))}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              
              {newPersona.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newPersona.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-transparent"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={handleCreatePersona}
                className="flex-1"
              >
                Create Persona
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}