"use client";

import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordButtonProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function RecordButton({ isRecording, onStart, onStop }: RecordButtonProps) {
  const handleClick = () => {
    console.log("Record button clicked, isRecording:", isRecording);
    if (isRecording) {
      console.log("Calling onStop");
      onStop();
    } else {
      console.log("Calling onStart");
      onStart();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-32 h-32 rounded-full flex items-center justify-center transition-all transform hover:scale-105",
        "shadow-lg hover:shadow-xl",
        isRecording 
          ? "bg-red-500 hover:bg-red-600 animate-pulse" 
          : "bg-red-600 hover:bg-red-700"
      )}
    >
      {isRecording ? (
        <MicOff className="w-12 h-12 text-white" />
      ) : (
        <Mic className="w-12 h-12 text-white" />
      )}
    </button>
  );
}