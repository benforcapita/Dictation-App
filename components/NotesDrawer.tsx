"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "lucide-react";
import { Note } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface NotesDrawerProps {
  notes: Note[];
  onClearNotes: () => void;
}

export function NotesDrawer({ notes, onClearNotes }: NotesDrawerProps) {
  const { toast } = useToast();

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { 
      type: "application/json" 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice-notes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Notes exported",
      description: "Your notes have been exported successfully.",
    });
  };

  const handleClearNotes = () => {
    if (window.confirm("Are you sure you want to clear all notes? This cannot be undone.")) {
      onClearNotes();
      toast({
        title: "Notes cleared",
        description: "All notes have been deleted.",
      });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-6 right-6">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notes Management</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          <div className="flex flex-col gap-4">
            <Button onClick={handleExport}>
              Export Notes
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearNotes}
            >
              Clear All Notes
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">All Notes ({notes.length})</h3>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4 pr-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-lg border bg-muted"
                  >
                    <p className="mb-2 text-sm">{note.text}</p>
                    <time className="text-xs text-muted-foreground">
                      {new Date(note.timestamp).toLocaleString()}
                    </time>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}