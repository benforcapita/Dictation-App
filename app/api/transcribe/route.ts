import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Increase timeout for large files

// Updated list of supported formats including iOS formats
const SUPPORTED_AUDIO_FORMATS = [
  'mp4', 'm4a', 'aac',  // iOS formats
  'webm', 'wav', 'mp3', 'mpeg', 
  'flac', 'ogg', 'oga', 'mpga'
];

const SUPPORTED_MIME_TYPES = [
  'audio/mp4', 'audio/x-m4a', 'audio/aac',
  'audio/webm', 'audio/wav', 'audio/mpeg',
  'audio/flac', 'audio/ogg', 'application/ogg',
  'audio/mp3', 'video/mp4', 'video/webm'
];

export async function POST(req: NextRequest) {
  console.log("Transcribe API route called");

  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not configured");
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as File;

    if (!audioFile) {
      console.error("No audio file provided");
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log("Received audio file:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // More lenient format checking
    const fileExtension = audioFile.name.split('.').pop()?.toLowerCase();
    const mimeType = audioFile.type.toLowerCase();

    const isValidFormat = 
      SUPPORTED_AUDIO_FORMATS.includes(fileExtension || '') ||
      SUPPORTED_MIME_TYPES.includes(mimeType);

    if (!isValidFormat) {
      console.error("Invalid file format:", {
        extension: fileExtension,
        mimeType: mimeType,
        supportedFormats: SUPPORTED_AUDIO_FORMATS,
        supportedMimeTypes: SUPPORTED_MIME_TYPES
      });
      return NextResponse.json(
        { 
          error: `Invalid file format. Supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
          supportedFormats: SUPPORTED_AUDIO_FORMATS,
          supportedMimeTypes: SUPPORTED_MIME_TYPES,
          receivedFormat: {
            extension: fileExtension,
            mimeType: mimeType
          }
        },
        { status: 400 }
      );
    }

    // Convert File to Blob for OpenAI API
    const audioBlob = await audioFile.arrayBuffer().then(buffer => new Blob([buffer], { type: audioFile.type }));

    // Create form data for OpenAI API
    const openAIFormData = new FormData();
    openAIFormData.append("file", audioBlob, "audio." + (fileExtension || 'mp4'));
    openAIFormData.append("model", "whisper-1");
    openAIFormData.append("language", "en");

    console.log("Sending request to OpenAI");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openAIFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        { error: "Failed to transcribe audio" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Transcription successful");
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process audio file" },
      { status: 500 }
    );
  }
}