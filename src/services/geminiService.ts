import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
};

export const generateTeamLogo = async (prompt: string, size: "1K" | "2K" | "4K" = "1K") => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: {
      parts: [{ text: `A professional eSports team logo for a Call of Duty team. Style: aggressive, modern, vector. Theme: ${prompt}` }],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateTournamentTrailer = async (imagePrompt: string, base64Image: string, aspectRatio: "16:9" | "9:16" = "16:9") => {
  const ai = getAI();
  let operation = await ai.models.generateVideos({
    model: "veo-3.1-fast-generate-preview",
    prompt: `An epic cinematic gaming tournament trailer scene. ${imagePrompt}. High intensity, smoke, fire, slow motion.`,
    image: {
      imageBytes: base64Image.split(",")[1],
      mimeType: "image/png",
    },
    config: {
      numberOfVideos: 1,
      resolution: "720p",
      aspectRatio: aspectRatio,
    },
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) return null;

  const response = await fetch(downloadLink, {
    method: "GET",
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY || "",
    },
  });
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const getTeamStrategy = async (teamName: string, players: string[]) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Give a short, epic battle strategy for a Call of Duty team named "${teamName}" consisting of players "${players.join(" and ")}". Keep it under 100 words. Focus on teamwork and the "Call of the Coders" theme.`,
  });
  return response.text;
};
