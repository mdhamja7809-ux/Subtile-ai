import { SubtitleEntry } from "../types";

export function generateSRT(subtitles: SubtitleEntry[]): string {
  return subtitles
    .map((sub, index) => {
      const id = index + 1;
      return `${id}\n${sub.startTime.replace('.', ',')} --> ${sub.endTime.replace('.', ',')}\n${sub.text}\n`;
    })
    .join("\n");
}

export function downloadSRT(content: string, filename: string = "subtitles.srt") {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
}
