import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function getTextInAudio(
  buffer: Buffer,
  fileName: string = "audio.mp3"
): Promise<string | null> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY não está configurada nas variáveis de ambiente");
      return null;
    }

    const mimeType = getMimeType(fileName);

    const audioData = new Uint8Array(buffer);
    const audioFile = new File([audioData], fileName, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text",
      language: "pt",
    });

    return transcription || null;
  } catch (error) {
    console.error("Erro ao transcrever áudio:", error);
    return null;
  }
}

function getMimeType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "mp3":
      return "audio/mpeg";
    case "mp4":
    case "m4a":
      return "audio/mp4";
    case "wav":
      return "audio/wav";
    case "webm":
      return "audio/webm";
    case "ogg":
      return "audio/ogg";
    case "flac":
      return "audio/flac";
    default:
      return "audio/mpeg";
  }
}
