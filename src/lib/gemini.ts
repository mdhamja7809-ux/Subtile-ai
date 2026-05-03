import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function transcribeAudio(audioBase64: string, mimeType: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing. Please check your environment variables.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "You are a professional Bengali audio transcriber. Transcribe the following audio precisely. For each spoken segment, provide the start time, end time, and the transcription in Bengali. Format your response strictly as a JSON array of objects with the keys 'startTime' (in the format HH:MM:SS,mmm), 'endTime' (in the format HH:MM:SS,mmm), and 'text'. Example: [{ \"startTime\": \"00:00:01,200\", \"endTime\": \"00:00:04,500\", \"text\": \"বাংলা ন্যারেশন এখানে হবে।\" }]",
          },
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.STRING },
            endTime: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ["startTime", "endTime", "text"],
        },
      },
    },
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No transcription text received from AI.");
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("AI failed to generate a valid JSON transcription.");
  }
}
