"use client";

import { Note } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotesListProps {
  notes: Note[];
}

export function NotesList({ notes }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No notes yet. Start recording to create your first note!
      </p>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 pr-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-4 rounded-lg border bg-card text-card-foreground"
          >
            <p className="mb-2">{note.text}</p>
            <time className="text-sm text-muted-foreground">
              {new Date(note.timestamp).toLocaleString()}
            </time>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}