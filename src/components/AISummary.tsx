import React, { useState } from 'react';
import { Sparkles, Loader2, Volume2, Eye, EyeOff } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '../context/AuthContext';
import Markdown from 'react-markdown';
import { generateSpeech } from '../services/geminiService';

interface AISummaryProps {
  content: string;
  title: string;
}

export const AISummary: React.FC<AISummaryProps> = ({ content, title }) => {
  const [summaries, setSummaries] = useState<{ text: string, mode: string, audioUrl?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [mode, setMode] = useState<'short' | 'detailed' | 'bullet' | 'concepts'>('short');

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Summarize the following content: "${content}". 
      Mode: ${mode}. 
      Title: ${title}.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const newText = response.text || 'No summary generated.';
      setSummaries(prev => [...prev, { text: newText, mode }]);
    } catch (error) {
      console.error('Error summarizing:', error);
      setSummaries(prev => [...prev, { text: 'Failed to generate summary.', mode }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = async (index: number, text: string) => {
    setIsSpeaking(index);
    try {
      const url = await generateSpeech(text);
      if (url) {
         setSummaries(prev => {
            const newSummaries = [...prev];
            newSummaries[index].audioUrl = url;
            return newSummaries;
         });
      }
    } catch (error) {
      console.error("Error generating speech", error);
    } finally {
      setIsSpeaking(null);
    }
  };

  return (
    <div className="p-8 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          AI Summary
        </h3>
      </div>
      
      <div className="space-y-4">
        {summaries.map((s, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded">
                {s.mode}
              </span>
              
              {s.audioUrl ? (
                <audio controls src={s.audioUrl} autoPlay className="h-8 w-48" />
              ) : (
                <button 
                  onClick={() => handleTTS(idx, s.text)}
                  disabled={isSpeaking === idx}
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all disabled:opacity-50 text-xs font-semibold"
                >
                  {isSpeaking === idx ? (
                    <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  Listen
                </button>
              )}
            </div>
            <div className="prose prose-zinc prose-sm max-w-none text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <Markdown>{s.text}</Markdown>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Mode</label>
        <select 
          value={mode} 
          onChange={e => setMode(e.target.value as any)}
          className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-black uppercase tracking-widest outline-none"
        >
          <option value="short">Short</option>
          <option value="detailed">Detailed</option>
          <option value="bullet">Bullet Points</option>
          <option value="concepts">Key Concepts</option>
        </select>
      </div>

      <button 
        onClick={handleSummarize}
        disabled={loading}
        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Summary'}
      </button>
    </div>
  );
};
