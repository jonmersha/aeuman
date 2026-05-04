import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSpeech(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Read this lesson content clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData?.data) {
      const base64Audio = inlineData.data;
      const binaryString = atob(base64Audio);

      // If it already has a RIFF header, it's already a playable format (likely WAV)
      if (binaryString.startsWith('RIFF')) {
        const mimeType = inlineData.mimeType || "audio/wav";
        return `data:${mimeType};base64,${base64Audio}`;
      }
      
      // Otherwise, assume it's raw 16-bit PCM at 24000Hz (Gemini TTS default)
      const pcmData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pcmData[i] = binaryString.charCodeAt(i);
      }

      const sampleRate = 24000;
      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);
      
      const wavData = new Uint8Array(44 + pcmData.length);
      const view = new DataView(wavData.buffer);

      const writeString = (v: DataView, offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          v.setUint8(offset + i, str.charCodeAt(i));
        }
      };

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + pcmData.length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);
      writeString(view, 36, 'data');
      view.setUint32(40, pcmData.length, true);

      wavData.set(pcmData, 44);

      // Construct base64 safely
      let wavBinaryString = '';
      for (let i = 0; i < wavData.length; i++) {
        wavBinaryString += String.fromCharCode(wavData[i]);
      }
      
      const wavBase64 = btoa(wavBinaryString);
      return `data:audio/wav;base64,${wavBase64}`;
    }
    return null;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
}

export async function summarizeLesson(content: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Summarize this lesson content for a student: ${content}`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Summarization Error:", error);
    return null;
  }
}
