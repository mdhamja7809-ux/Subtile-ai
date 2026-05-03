export interface SubtitleEntry {
  id: number;
  startTime: string; // HH:MM:SS,mmm
  endTime: string;
  text: string;
}

export interface TranscriptionResult {
  subtitles: SubtitleEntry[];
  rawText: string;
}
