import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileAudio, 
  Upload, 
  Download, 
  Loader2, 
  CheckCircle2, 
  X, 
  AlertCircle,
  FileText,
  Play
} from "lucide-react";
import { transcribeAudio } from "./lib/gemini";
import { generateSRT, downloadSRT, fileToBase64 } from "./lib/srt-utils";
import { SubtitleEntry } from "./types";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith("audio/") || selectedFile.type.startsWith("video/")) {
        setFile(selectedFile);
        setError(null);
        setSubtitles([]);
        setSuccess(false);
      } else {
        setError("অনুগ্রহ করে একটি অডিও ফাইল নির্বাচন করুন। (Please select an audio file.)");
      }
    }
  };

  const processAudio = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const results = await transcribeAudio(base64, mimeType);
      
      const formattedSubtitles: SubtitleEntry[] = results.map((item: any, index: number) => ({
        id: index + 1,
        startTime: item.startTime,
        endTime: item.endTime,
        text: item.text
      }));

      setSubtitles(formattedSubtitles);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError("ট্রান্সক্রিপশন করার সময় একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (subtitles.length === 0) return;
    const srtContent = generateSRT(subtitles);
    downloadSRT(srtContent, `${file?.name.split('.')[0] || 'subtitles'}.srt`);
  };

  const updateSubtitleText = (id: number, newText: string) => {
    setSubtitles(prev => prev.map(sub => sub.id === id ? { ...sub, text: newText } : sub));
  };

  const reset = () => {
    setFile(null);
    setSubtitles([]);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 bg-white/5 backdrop-blur-lg sticky top-0">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <FileAudio className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Lekhok <span className="text-indigo-400 font-medium text-sm">PRO</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Bengali Transcription</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            {file && (
              <span className="text-[10px] font-medium text-slate-400 px-3 py-1 bg-white/5 rounded-full border border-white/5 truncate max-w-[200px]">
                {file.name}
              </span>
            )}
            <div className="h-8 w-px bg-white/10 mx-2" />
            <button className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">সহায়তা</button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Info & Upload */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-extrabold text-white leading-tight tracking-tight"
              >
                আপনার অডিও থেকে <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">সহজেই SRT</span> তৈরি করুন
              </motion.h2>
              <p className="text-base text-slate-400 leading-relaxed max-w-md">
                Gemini AI ব্যবহার করে আপনার অডিও ফাইলের জন্য নিখুঁত সাবটাইটেল জেনারেট করুন। প্রিমিয়াম গ্রাসমর্ফিজম এডিটর এখন আপনার হাতের মুঠোয়।
              </p>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div
                    key="uploader"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="relative"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="audio/*,video/*"
                      className="hidden"
                      id="audio-upload"
                    />
                    <label
                      htmlFor="audio-upload"
                      className="flex flex-col items-center justify-center w-full h-80 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-indigo-500/50 transition-all cursor-pointer group shadow-2xl"
                    >
                      <div className="p-6 bg-indigo-500/10 rounded-2xl group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500 border border-indigo-500/20">
                        <Upload className="w-10 h-10 text-indigo-400" />
                      </div>
                      <div className="mt-6 text-center">
                        <p className="text-lg font-bold text-slate-200">ফাইল আপলোড করতে এখানে ক্লিক করুন</p>
                        <p className="text-sm text-slate-500 mt-2">MP3, WAV, M4A & MP4 Supported</p>
                      </div>
                    </label>
                  </motion.div>
                ) : (
                  <motion.div
                    key="file-info"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                          <FileText className="text-indigo-400 w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white truncate max-w-[240px]">{file.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-mono text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{file.type.split('/')[1]}</span>
                          </div>
                        </div>
                      </div>
                      {!isProcessing && (
                        <button 
                          onClick={reset}
                          className="p-2 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-colors border border-transparent hover:border-white/10"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {!success ? (
                      <button
                        onClick={processAudio}
                        disabled={isProcessing}
                        className="w-full mt-8 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-200" />
                            <span className="tracking-wide">প্রসেসিং হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 fill-current" />
                            <span className="tracking-wide">AI ট্রান্সস্ক্রাইব শুরু করুন</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="mt-8 grid gap-4">
                        <div className="flex items-center gap-3 text-teal-400 font-bold text-sm bg-teal-500/10 border border-teal-500/20 px-5 py-3 rounded-xl shadow-inner">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>সফলভাবে সম্পন্ন হয়েছে!</span>
                        </div>
                        <button
                          onClick={handleDownload}
                          className="w-full py-5 bg-white text-slate-900 hover:bg-slate-100 font-extrabold rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                          <Download className="w-6 h-6" />
                          <span>SRT ডাউনলোড করুন</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-sm backdrop-blur-sm"
                >
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  <p className="font-medium">{error}</p>
                </motion.div>
              )}
            </div>
            
            {/* AI Processing Tips (Theme specific aside content) */}
            <div className="bg-indigo-500/5 backdrop-blur-md border border-indigo-500/10 rounded-3xl p-6">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">AI প্রসেসিং টিপস</h2>
              <p className="text-sm text-slate-400 leading-relaxed italic">
                "যতিচিহ্ন সঠিকভাবে বসাতে ব্যাকরণগত বিশ্লেষণ ব্যবহার করুন। SRT ফরম্যাটে প্রতিটি লাইনের জন্য ২-৪ সেকেন্ড সময় নির্ধারণ আদর্শ।"
              </p>
            </div>
          </div>

          {/* Right Column: Transcription Preview */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[740px] relative">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-lg font-bold text-white leading-none">ট্রান্সক্রিপশন এডিটর</h3>
                <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">শব্দ এবং সময় সম্পাদনা করুন</p>
              </div>
              {subtitles.length > 0 && (
                <div className="flex items-center gap-3">
                   <div className="h-6 w-px bg-white/10" />
                   <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                     {subtitles.length} SETS
                   </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {subtitles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-6 opacity-40">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 animate-pulse">
                    <FileText className="w-12 h-12" />
                  </div>
                  <p className="text-sm font-bold tracking-widest uppercase">ডেটা পাওয়া যায়নি</p>
                </div>
              ) : (
                subtitles.map((sub, idx) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex gap-6 group relative"
                  >
                    <div className="text-indigo-500/50 font-mono text-sm pt-4 font-bold select-none group-hover:text-indigo-400 transition-colors">
                      {String(sub.id).padStart(2, '0')}
                    </div>
                    <div className="flex-1 space-y-3 p-4 rounded-3xl bg-white/0 hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2 text-[10px] font-mono text-slate-500">
                          <span className="bg-white/5 px-2 py-1 rounded-lg border border-white/5 text-slate-400">{sub.startTime}</span>
                          <span className="py-1 text-indigo-500/40">➔</span>
                          <span className="bg-white/5 px-2 py-1 rounded-lg border border-white/5 text-indigo-300">{sub.endTime}</span>
                        </div>
                      </div>
                      <textarea
                        value={sub.text}
                        onChange={(e) => updateSubtitleText(sub.id, e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-200 text-lg font-medium leading-relaxed resize-none focus:outline-none placeholder:text-slate-700"
                        rows={2}
                        placeholder="টেক্সট এখানে লিখুন..."
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[6px] flex flex-col items-center justify-center z-20">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-[#1a2333] p-10 rounded-[2.5rem] border border-white/10 shadow-[0_0_80px_rgba(79,70,229,0.15)] flex flex-col items-center gap-6 text-center max-w-sm"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-2xl animate-pulse"></div>
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white">AI জেনারেট হচ্ছে</h4>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed px-4">
                      Gemini আপনার অডিও থেকে প্রতিটি বাংলা শব্দ বিশ্লেষণ করছে। এতে কিছুটা সময় লাগতে পারে।
                    </p>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="relative z-10 max-w-6xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/10 cursor-default">
              <FileAudio className="text-white w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white tracking-widest">LEKHOK</span>
              <span className="text-[10px] text-slate-500 font-bold">SMART TRANSCRIPTION SYSTEM</span>
            </div>
          </div>
          <div className="flex gap-10 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            <span className="hover:text-indigo-400 cursor-default transition-colors">Gemini 3.1 Flash</span>
            <span className="hover:text-teal-400 cursor-default transition-colors">Advanced BN-ASR</span>
            <span className="hover:text-white cursor-default transition-colors">Studio Grade</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
