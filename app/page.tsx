"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Note } from "@/lib/types";
import { loadNotes, saveNotes, clearNotes } from "@/lib/storage";
import { RecordButton } from "@/components/RecordButton";
import { NotesDrawer } from "@/components/NotesDrawer";
import { LatestNote } from "@/components/LatestNote";
import { Loader } from "@/components/Loader";

// Common audio formats with better iOS support
const PREFERRED_MIME_TYPES = [
  'audio/mp4',           // iOS preferred
  'audio/m4a',           // iOS alternative
  'audio/aac',           // iOS fallback
  'audio/webm',          // Modern browsers
  'audio/wav',           // Wide support
  'audio/mpeg',          // Fallback
  ''                     // Let browser choose format
];

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Log supported MIME types
    console.log("Testing MIME type support:");
    PREFERRED_MIME_TYPES.forEach(type => {
      console.log(`${type}: ${type ? MediaRecorder.isTypeSupported(type) : 'default'}`);
    });
    setNotes(loadNotes());
  }, []);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const startRecording = async () => {
    console.log("[START_RECORDING] Starting recording process");
    console.log("[DEVICE_INFO]", {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor
    });

    try {
      // Reset audio chunks at the start
      audioChunksRef.current = [];
      console.log("[AUDIO_CHUNKS] Reset audio chunks");

      // Request microphone permission
      console.log("[MEDIA_REQUEST] Requesting microphone access with options:", {
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      console.log("[MEDIA_STREAM] Got media stream:", {
        tracks: stream.getTracks().map(track => ({
          kind: track.kind,
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          constraints: track.getConstraints()
        }))
      });

      // Log available MIME types
      console.log("[MIME_TYPES] Testing MIME type support:");
      const mimeTypeSupport: Record<string, boolean | string> = {};
      PREFERRED_MIME_TYPES.forEach(type => {
        mimeTypeSupport[type] = type ? MediaRecorder.isTypeSupported(type) : 'default';
      });
      console.log("[MIME_TYPES] Support matrix:", mimeTypeSupport);

      // Find the first supported MIME type
      const mimeType = PREFERRED_MIME_TYPES.find(type => !type || MediaRecorder.isTypeSupported(type)) || '';
      console.log("[MIME_TYPE] Selected:", mimeType || 'browser default');
      
      // Create recorder with options
      const recorderOptions = mimeType ? { 
        mimeType,
        audioBitsPerSecond: 128000
      } : undefined;
      console.log("[RECORDER_OPTIONS]", recorderOptions);

      const recorder = new MediaRecorder(stream, recorderOptions);
      console.log("[RECORDER] Created with state:", recorder.state);
      
      // Set up event handlers before starting
      recorder.ondataavailable = (event) => {
        console.log("[RECORDER_DATA]", {
          type: event.data.type,
          size: event.data.size,
          timestamp: new Date().toISOString()
        });
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log("[AUDIO_CHUNKS] Added chunk, total chunks:", audioChunksRef.current.length);
        }
      };

      recorder.onstop = async () => {
        console.log("[RECORDER_STOP] Processing audio...");
        stream.getTracks().forEach(track => {
          track.stop();
          console.log("[TRACK_STOP] Stopped track:", track.label);
        });
        
        const chunks = audioChunksRef.current;
        console.log("[AUDIO_CHUNKS] Processing chunks:", {
          count: chunks.length,
          totalSize: chunks.reduce((acc, chunk) => acc + chunk.size, 0),
          types: chunks.map(chunk => chunk.type)
        });
        
        if (chunks.length === 0) {
          console.error("[ERROR] No audio chunks recorded");
          toast({
            title: "Error",
            description: "No audio data was captured",
            variant: "destructive",
          });
          return;
        }

        const audioBlob = new Blob(chunks, { type: mimeType || 'audio/mp4' });
        console.log("[AUDIO_BLOB] Created:", {
          type: audioBlob.type,
          size: audioBlob.size
        });
        
        if (audioBlob.size === 0) {
          console.error("[ERROR] Audio blob is empty");
          toast({
            title: "Error",
            description: "Audio recording is empty",
            variant: "destructive",
          });
          return;
        }

        const formData = new FormData();
        formData.append("file", audioBlob, `audio.${mimeType ? mimeType.split('/')[1] : 'mp4'}`);
        const fileEntry = formData.get("file") as File;
        console.log("[FORM_DATA] Created with file:", {
          fileName: fileEntry?.name,
          fileType: fileEntry?.type,
          fileSize: fileEntry?.size
        });

        setIsProcessing(true);
        console.log("[API_REQUEST] Sending to /api/transcribe...");
        
        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          console.log("[API_RESPONSE] Status:", response.status);
          const responseText = await response.text();
          console.log("[API_RESPONSE] Text:", responseText);

          if (!response.ok) {
            console.error("[API_ERROR] Response not OK:", {
              status: response.status,
              statusText: response.statusText,
              response: responseText
            });
            let errorMessage = "Transcription failed";
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              console.error("[ERROR] Failed to parse error response:", e);
            }
            throw new Error(errorMessage);
          }

          let data;
          try {
            data = JSON.parse(responseText);
            console.log("[API_SUCCESS] Parsed response:", data);
          } catch (e) {
            console.error("[ERROR] Failed to parse success response:", e);
            throw new Error("Invalid response from server");
          }
          
          if (data.text) {
            const newNote = {
              id: Date.now(),
              text: data.text,
              timestamp: new Date().toISOString(),
            };

            console.log("[NOTE] Creating new note:", newNote);
            setNotes(prevNotes => {
              const updatedNotes = [newNote, ...prevNotes];
              console.log("[NOTES] Updated notes list, count:", updatedNotes.length);
              return updatedNotes;
            });
            
            toast({
              title: "Success",
              description: "Audio transcribed successfully",
            });
          } else {
            console.error("[ERROR] No text in transcription response:", data);
            toast({
              title: "Error",
              description: "No text was transcribed from the audio",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("[ERROR] Transcription error:", error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to transcribe audio",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
          console.log("[PROCESS] Finished processing");
        }
      };

      console.log("[RECORDER_START] Starting with timeslice 1000ms");
      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "Speak now. Click the button again to stop recording.",
      });

    } catch (error) {
      console.error("[ERROR] Recording setup error:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error?.constructor?.name
      });
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
    console.log("[STOP_RECORDING] Stop recording called");
    if (mediaRecorder && mediaRecorder.state === "recording") {
      console.log("[RECORDER_STATE] Current state:", mediaRecorder.state);
      mediaRecorder.stop();
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Processing your audio...",
      });
    } else {
      console.log("[RECORDER_ERROR] Invalid recorder state:", {
        exists: !!mediaRecorder,
        state: mediaRecorder?.state
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white dark:bg-gray-900">
      {isProcessing && <Loader />}
      
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