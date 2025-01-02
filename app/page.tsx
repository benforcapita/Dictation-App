"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Note } from "@/lib/types";
import { loadNotes, saveNotes, clearNotes } from "@/lib/storage";
import { RecordButton } from "@/components/RecordButton";
import { NotesDrawer } from "@/components/NotesDrawer";
import { LatestNote } from "@/components/LatestNote";

// Common audio formats that work well with OpenAI Whisper
const PREFERRED_MIME_TYPES = [
  'audio/webm',
  'audio/wav',
  'audio/mp3',
  'audio/mpeg'
];

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Log supported MIME types
    console.log("Supported MIME types:");
    PREFERRED_MIME_TYPES.forEach(type => {
      console.log(`${type}: ${MediaRecorder.isTypeSupported(type)}`);
    });
    setNotes(loadNotes());
  }, []);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const startRecording = async () => {
    console.log("Start recording called");
    try {
      // Reset audio chunks at the start
      audioChunksRef.current = [];

      // Request microphone permission
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted");
      
      // Find the first supported MIME type
      const mimeType = PREFERRED_MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) {
        throw new Error("No supported audio MIME types found");
      }

      console.log("Selected MIME type:", mimeType);
      
      const recorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000 // Set to 128kbps for better quality
      });
      
      // Set up event handlers before starting
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("Received audio chunk:", event.data.type, event.data.size);
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        console.log("Recorder stopped, processing audio...");
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Get the accumulated chunks
        const chunks = audioChunksRef.current;
        console.log("Number of audio chunks:", chunks.length);
        
        if (chunks.length === 0) {
          console.error("No audio chunks recorded");
          toast({
            title: "Error",
            description: "No audio data was captured",
            variant: "destructive",
          });
          return;
        }

        const audioBlob = new Blob(chunks, { type: mimeType });
        console.log("Created audio blob:", {
          type: audioBlob.type,
          size: audioBlob.size
        });
        
        if (audioBlob.size === 0) {
          console.error("Audio blob is empty");
          toast({
            title: "Error",
            description: "Audio recording is empty",
            variant: "destructive",
          });
          return;
        }

        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");

        console.log("Preparing to send to /api/transcribe...");
        try {
          console.log("FormData contents:", {
            file: formData.get("file"),
            fileName: (formData.get("file") as File)?.name,
            fileType: (formData.get("file") as File)?.type,
            fileSize: (formData.get("file") as File)?.size,
          });

          console.log("Sending POST request to /api/transcribe");
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          console.log("Received response:", response.status);
          const responseText = await response.text();
          console.log("Response text:", responseText);

          if (!response.ok) {
            let errorMessage = "Transcription failed";
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              console.error("Failed to parse error response:", e);
            }
            throw new Error(errorMessage);
          }

          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error("Failed to parse success response:", e);
            throw new Error("Invalid response from server");
          }

          console.log("Transcription response:", data);
          
          if (data.text) {
            const newNote: Note = {
              id: Date.now(),
              text: data.text,
              timestamp: new Date().toISOString(),
            };

            console.log("Creating new note:", newNote);
            setNotes(prevNotes => {
              console.log("Previous notes:", prevNotes);
              const updatedNotes = [newNote, ...prevNotes];
              console.log("Updated notes:", updatedNotes);
              return updatedNotes;
            });
            
            toast({
              title: "Success",
              description: "Audio transcribed successfully",
            });
          } else {
            console.error("No text in transcription response:", data);
            toast({
              title: "Error",
              description: "No text was transcribed from the audio",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Transcription error:", error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to transcribe audio",
            variant: "destructive",
          });
        }
      };

      // Start recording with a timeslice to get data periodically
      console.log("Starting MediaRecorder...");
      recorder.start(1000); // Get data every second
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "Speak now. Click the button again to stop recording.",
      });

    } catch (error) {
      console.error("Recording error:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive",
      });
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const stopRecording = () => {
    console.log("Stop recording called");
    if (mediaRecorder && mediaRecorder.state === "recording") {
      console.log("Stopping media recorder");
      mediaRecorder.stop();
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Processing your audio...",
      });
    } else {
      console.log("MediaRecorder state:", mediaRecorder?.state);
      if (!mediaRecorder) {
        console.error("No MediaRecorder available");
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white dark:bg-gray-900">
      <div className="fixed top-6 right-6">
        <NotesDrawer 
          notes={notes} 
          onClearNotes={() => {
            clearNotes();
            setNotes([]);
          }} 
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Voice Notes</h1>
        <RecordButton 
          isRecording={isRecording} 
          onStart={startRecording} 
          onStop={stopRecording}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isRecording ? "Click to stop recording" : "Click to start recording"}
        </p>
      </div>

      <div className="mt-8">
        <LatestNote note={notes[0]} />
      </div>
    </main>
  );
}