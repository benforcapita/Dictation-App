"use client";

import { Note } from "@/lib/types";

interface LatestNoteProps {
  note?: Note;
}

export function LatestNote({ note }: LatestNoteProps) {
  return (
    <div className="bg-card rounded-lg shadow-sm p-6">
      {note ? (
        <div className="max-w-lg p-6 rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Latest Note</h2>
          <p className="text-gray-700 dark:text-gray-300">{note.text}</p>
          <time className="block mt-2 text-sm text-gray-500 dark:text-gray-400">
            {new Date(note.timestamp).toLocaleString()}
          </time>
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          No notes yet. Start recording to create one!
        </div>
      )}
    </div>
  );
}