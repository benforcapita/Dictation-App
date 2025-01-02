import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const SUPPORTED_AUDIO_FORMATS = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];

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

    // Check file format
    const fileExtension = audioFile.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !SUPPORTED_AUDIO_FORMATS.includes(fileExtension)) {
      console.error("Invalid file format:", {
        extension: fileExtension,
        supportedFormats: SUPPORTED_AUDIO_FORMATS
      });
      return NextResponse.json(
        { 
          error: `Invalid file format. Supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
          supportedFormats: SUPPORTED_AUDIO_FORMATS,
          receivedFormat: {
            extension: fileExtension,
            mimeType: audioFile.type
          }
        },
        { status: 400 }
      );
    }

    // Create a new FormData instance for the OpenAI API
    const openAIFormData = new FormData();
    openAIFormData.append("file", audioFile);
    openAIFormData.append("model", "whisper-1");

    console.log("Sending request to OpenAI:", {
      url: "https://api.openai.com/v1/audio/transcriptions",
      fileName: audioFile.name,
      fileType: audioFile.type,
      fileSize: audioFile.size,
      model: "whisper-1"
    });

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: openAIFormData,
      }
    );

    console.log("OpenAI response status:", response.status);
    const responseData = await response.text();
    console.log("OpenAI raw response:", responseData);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseData);
      } catch (e) {
        console.error("Failed to parse OpenAI error response:", e);
        errorData = { error: { message: "Unknown error occurred" } };
      }
      console.error("OpenAI API Error:", errorData);
      throw new Error(
        `Transcription failed: ${response.status} ${response.statusText}`
      );
    }

    const data = JSON.parse(responseData);
    console.log("OpenAI success response:", data);
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}