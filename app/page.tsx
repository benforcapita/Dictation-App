"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Note } from "@/lib/types";
import { loadNotes, saveNotes, clearNotes } from "@/lib/storage";
import { RecordButton } from "@/components/RecordButton";
import { NotesDrawer } from "@/components/NotesDrawer";
import { LatestNote } from "@/components/LatestNote";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");

        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Transcription failed");
          }

          const data = await response.json();
          const newNote: Note = {
            id: crypto.randomUUID(),
            text: data.text,
            timestamp: new Date().toISOString(),
          };

          setNotes((prev) => [newNote, ...prev]);
          toast({
            title: "Note saved",
            description: "Your dictation has been transcribed and saved.",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to transcribe audio. Please try again.",
            variant: "destructive",
          });
        }

        setAudioChunks([]);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setIsRecording(false);
        }
      }, 10000);

      toast({
        title: "Recording started",
        description: "Recording will automatically stop after 10 seconds.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleClearNotes = () => {
    clearNotes();
    setNotes([]);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center p-6">
      <NotesDrawer notes={notes} onClearNotes={handleClearNotes} />
      
      <div className="w-full max-w-2xl space-y-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Voice Notes</h1>
          <p className="text-muted-foreground">
            Record your thoughts and they&apos;ll be automatically transcribed
          </p>
        </div>

        <div className="flex justify-center py-8">
          <RecordButton 
            isRecording={isRecording} 
            onClick={handleRecordClick} 
          />
        </div>

        <LatestNote note={notes[0]} />
      </div>
    </main>
  );
}