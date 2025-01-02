"use client";

import { Note } from "@/lib/types";

interface LatestNoteProps {
  note?: Note;
}

export function LatestNote({ note }: LatestNoteProps) {
  if (!note) {
    return (
      <div className="bg-card rounded-lg shadow-sm p-6 text-center text-muted-foreground">
        No notes yet. Start recording to create your first note!
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Latest Note</h2>
      <div className="space-y-2">
        <p className="text-lg">{note.text}</p>
        <time className="text-sm text-muted-foreground block">
          {new Date(note.timestamp).toLocaleString()}
        </time>
      </div>
    </div>
  );
}