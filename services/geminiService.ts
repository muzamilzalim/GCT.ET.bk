
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { Attachment } from "../types";

const API_KEY = process.env.API_KEY || "";

/**
 * Detects if the user wants to generate an image/diagram.
 */
const isImageRequest = (prompt: string): boolean => {
  const keywords = ['diagram', 'draw', 'image', 'picture', 'visualize', 'create a photo', 'generate a diagram', 'circuit diagram', 'schematic'];
  return keywords.some(k => prompt.toLowerCase().includes(k));
};

export const getGeminiChatResponse = async (
  prompt: string, 
  history: {role: string, content: string}[],
  attachments: Attachment[] = []
) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Handle Image Generation Requests
  if (isImageRequest(prompt)) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Create a professional, clear, high-contrast engineering diagram or schematic for: ${prompt}. Use standard electrical symbols and labels. Black or dark background.` }]
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return {
            content: "<b>Schematic Analysis Complete</b><p>The requested diagram has been generated based on current electrical standards.</p>",
            imageData: `data:image/png;base64,${part.inlineData.data}`,
            isImage: true
          };
        }
      }
    } catch (e) {
      console.error("Image Gen Error:", e);
    }
  }

  // Handle Standard Text Response
  const historyParts = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  const currentParts: any[] = [{ text: prompt }];
  attachments.forEach(att => {
    currentParts.push({
      inlineData: {
        data: att.data.split(',')[1],
        mimeType: att.mimeType
      }
    });
  });

  const contents = [
    ...historyParts,
    { role: 'user', parts: currentParts }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents as any,
      config: {
        systemInstruction: `You are GCT.ET, a specialized high-performance AI in Electrical Technology.
        STRICT RULES:
        1. NO Markdown (*, #, _, -).
        2. Use <b>Tags</b> for Bold headings.
        3. Use <i>Tags</i> for primary technical definitions.
        4. Use <p>Tags</p> for all explanations.
        5. Tone: Technical, Precise, Professional.
        6. Use numbered lists (1., 2.) if needed.`,
        temperature: 0.1,
      }
    });
    
    let text = response.text || "";
    text = text.replace(/[#\*_$\-]+/g, ''); 
    return { content: text, isImage: false };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return { content: "<p>Neural signal corrupted. Terminal failure.</p>", isImage: false };
  }
};

export const translateText = async (text: string, targetLanguage: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `Translate precisely for Electrical Engineers into ${targetLanguage}. Maintain HTML tags (<b>, <i>, <p>): ${text}` }] }],
    });
    return response.text;
  } catch (error) {
    return null;
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const cleanText = text.replace(/<\/?[^>]+(>|$)/g, "");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    return undefined;
  }
};
