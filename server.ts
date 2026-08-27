import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Same-origin by default. Set HNL_ALLOWED_ORIGINS as a comma-separated allow-list
// only when the web frontend is hosted on a different origin.
const allowedOrigins = new Set((process.env.HNL_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (req.method === "OPTIONS") {
    if (!origin || allowedOrigins.has(origin)) return res.sendStatus(204);
    return res.sendStatus(403);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) genAIClient = new GoogleGenAI({ apiKey });
  return genAIClient;
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    version: "1.1.0",
    engine: "HNL Creative AI Core"
  });
});

app.post("/api/ai/analyze-asset", async (req, res) => {
  try {
    const { assetType, mimeType, base64Data, filename, context } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        source: "local-heuristic",
        analysis: {
          description: `Asset "${filename}" (${assetType}) analyzed locally.`,
          tags: [assetType, filename.split(".").pop() || "media"],
          detectedElements: {
            objects: ["media_subject"],
            peopleCount: 0,
            clothing: [],
            scene: "Studio/General",
            dominantColors: ["#ffffff", "#1e293b"],
            ocrText: ""
          },
          aiReadiness: true
        }
      });
    }

    const prompt = `Analyze this ${assetType} (${filename}) for a creative multimodal studio.
Context: ${context || "General creative media asset"}
Provide a structured JSON output with:
{
  "description": "Concise visual/content summary in Vietnamese and English",
  "tags": ["tag1", "tag2", "tag3"],
  "detectedElements": {
    "objects": ["detected object names"],
    "peopleCount": 0,
    "clothing": ["clothing items if any"],
    "scene": "description of setting",
    "dominantColors": ["#hex1", "#hex2"],
    "ocrText": "any text seen in the media"
  },
  "suggestedRoles": ["Character", "Clothing", "Environment", "Product", "Motion", "Audio", "B-roll"]
}`;

    const parts: any[] = [{ text: prompt }];
    if (base64Data && mimeType) {
      parts.push({ inlineData: { mimeType, data: base64Data.replace(/^data:[^;]+;base64,/, "") } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: parts,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { parsed = { description: text, tags: ["creative", assetType] }; }
    res.json({ success: true, source: "gemini-3.7-flash", analysis: parsed });
  } catch (error: any) {
    console.error("Asset analysis error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to analyze asset" });
  }
});

app.post("/api/ai/creative-director", async (req, res) => {
  try {
    const { prompt, assets, brandKit, duration = 30, aspectRatio = "16:9", mode = "mixed_media" } = req.body;
    const ai = getGenAI();

    if (!ai) {
      const media = Array.isArray(assets) ? assets : [];
      const sceneDuration = Math.max(3, Math.floor(duration / 3));
      const contact = brandKit?.phone || brandKit?.website || brandKit?.email || "";
      const scenes = [0, 1, 2].map((idx) => {
        const asset = media[idx] || media[0];
        const isOutro = idx === 2;
        return {
          id: `scene-${idx + 1}`,
          title: idx === 0 ? "Scene 1: Hook" : isOutro ? "Scene 3: CTA" : "Scene 2: Main content",
          duration: isOutro ? Math.min(5, sceneDuration) : sceneDuration,
          script: isOutro ? (contact ? `Liên hệ: ${contact}` : "CTA — bổ sung thông tin liên hệ trước khi xuất bản") : (prompt || "Draft scene — user review required"),
          visualPrompt: asset ? `Use uploaded asset: ${asset.name || asset.filename || asset.id}` : "Missing visual — user media or approved generation required",
          sourceAssetId: asset?.id || null,
          cameraMovement: idx === 0 ? "Zoom In" : "Static",
          transition: "fade",
          shotType: idx === 0 ? "Wide" : "Medium"
        };
      });
      return res.json({
        success: true,
        source: "local-director",
        plan: {
          concept: prompt || "Local storyboard draft",
          totalDuration: duration,
          aspectRatio,
          scenes,
          proposedChanges: [],
          missingMedia: media.length ? [] : [{ sceneNumber: 1, description: "No uploaded media selected", suggestedType: "video" }]
        }
      });
    }

    const systemPrompt = `You are the AI Creative Director of HNL Creative AI Studio.
Create a detailed, production-ready video storyboard and creative plan based on user instructions and available assets.
User Request: "${prompt}"
Target Duration: ${duration}s
Aspect Ratio: ${aspectRatio}
Mode: ${mode}
Brand Kit: ${JSON.stringify(brandKit || {})}
Available Assets count: ${assets?.length || 0} (List: ${JSON.stringify((assets || []).map((a: any) => ({ id: a.id, name: a.name, type: a.type, tags: a.tags })))} )
Rules:
1. ALWAYS prioritize user uploaded media over generating new AI media.
2. If certain scenes lack real assets, explicitly list them in "missingMedia".
3. Provide realistic camera movements.
4. Provide structured "proposedChanges" with concrete actionable items.
5. Return strictly valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ text: systemPrompt }],
      config: { responseMimeType: "application/json" }
    });
    res.json({ success: true, source: "gemini-3.7-flash", plan: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    console.error("Creative director error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate director plan" });
  }
});

app.post("/api/ai/generate-image", async (req, res) => {
  try {
    const { prompt, referenceImages, preserveOptions } = req.body;
    const ai = getGenAI();
    if (!ai) return res.status(400).json({ success: false, error: "GEMINI_API_KEY is not configured on the server." });

    let fullPrompt = prompt;
    if (preserveOptions) {
      const preserves: string[] = [];
      if (preserveOptions.preserveFace) preserves.push("Preserve original face and facial identity");
      if (preserveOptions.preserveHair) preserves.push("Preserve hairstyle and color");
      if (preserveOptions.preservePose) preserves.push("Preserve subject body pose");
      if (preserveOptions.preserveProduct) preserves.push("Preserve product branding, logo, and exact geometry");
      if (preserves.length) fullPrompt += `\nStrict Constraints: ${preserves.join(", ")}.`;
    }

    const parts: any[] = [{ text: fullPrompt }];
    if (referenceImages && Array.isArray(referenceImages)) {
      for (const img of referenceImages) {
        if (img.base64 && img.mimeType) {
          parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64.replace(/^data:[^;]+;base64,/, "") } });
        }
      }
    }

    const response = await ai.models.generateContent({ model: "gemini-3.1-flash-image", contents: parts });
    let generatedImageBase64: string | null = null;
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          generatedImageBase64 = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!generatedImageBase64) {
      return res.json({
        success: true,
        type: "text_guidance",
        textResponse: response.text || "Image generation instruction processed successfully.",
        promptUsed: fullPrompt
      });
    }
    res.json({ success: true, imageUrl: generatedImageBase64, promptUsed: fullPrompt });
  } catch (error: any) {
    console.error("Generate image error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate AI image" });
  }
});

app.post("/api/ai/generate-video", async (req, res) => {
  try {
    const { prompt, aspectRatio = "16:9", references = [], model = "gemini-omni-flash-preview" } = req.body;
    const ai = getGenAI();
    if (!ai) return res.status(400).json({ success: false, error: "GEMINI_API_KEY is not configured on the secure backend." });

    const content: any[] = (references || []).map((r: any) => ({
      type: r.type,
      mime_type: r.mimeType,
      data: String(r.base64 || "").replace(/^data:[^;]+;base64,/, "")
    }));
    content.push({ type: "text", text: prompt });
    const hasVideo = (references || []).some((r: any) => r.type === "video");
    const imageCount = (references || []).filter((r: any) => r.type === "image").length;
    const input = references.length === 0 ? prompt : hasVideo ? [{ type: "user_input", content }] : content;
    const task = hasVideo ? "edit" : imageCount > 1 ? "reference_to_video" : imageCount === 1 ? "image_to_video" : "text_to_video";

    const interactions = (ai as any).interactions;
    if (!interactions?.create) {
      return res.status(501).json({ success: false, error: "Installed @google/genai SDK does not expose the Interactions API. Update the package before enabling backend Omni video." });
    }
    const interaction = await interactions.create({
      model,
      input,
      response_format: { type: "video", aspect_ratio: aspectRatio },
      generationConfig: { videoConfig: { task } }
    });
    const output = interaction.output_video || interaction.outputVideo;
    if (!output?.data) return res.status(502).json({ success: false, error: "Gemini Omni returned no video payload." });
    const mimeType = output.mime_type || output.mimeType || "video/mp4";
    res.json({ success: true, videoUrl: `data:${mimeType};base64,${output.data}`, mimeType, interactionId: interaction.id, model });
  } catch (error: any) {
    console.error("Generate video error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate AI video" });
  }
});

app.post("/api/ai/video-capability-check", (req, res) => {
  const { provider = "gemini-veo", model = "veo-3.1-lite-generate-preview" } = req.body;
  const isOmni = model === "gemini-omni-flash-preview";
  const capabilities = {
    textToVideo: true,
    imageToVideo: true,
    videoToVideo: isOmni,
    firstFrame: !isOmni,
    lastFrame: !isOmni,
    imageReference: true,
    videoReference: isOmni,
    motionReference: false,
    characterReference: true,
    audioReference: false,
    nativeAudio: true,
    maxDurationSeconds: 8,
    supportedAspectRatios: ["16:9", "9:16"]
  };
  res.json({
    provider,
    model,
    capabilities,
    requiresPaidAccount: true,
    warning: isOmni ? "Existing-video editing is enabled through Gemini Omni Flash." : "Existing-video editing is not advertised for Veo in HNL; use Gemini Omni Flash."
  });
});

app.post("/api/ai/extract-document-story", async (req, res) => {
  try {
    const { documentText, filename, targetDuration = 30 } = req.body;
    const ai = getGenAI();
    if (!ai) {
      const paragraphs = (documentText || "").split("\n\n").filter(Boolean);
      const scenes = paragraphs.slice(0, 4).map((p: string, idx: number) => ({
        sceneNumber: idx + 1,
        title: `Section ${idx + 1}`,
        sourceExcerpt: p.substring(0, 120) + "...",
        script: p.substring(0, 200),
        duration: Math.round(targetDuration / Math.min(4, Math.max(1, paragraphs.length))),
        visualIdeas: `Showcase key themes from ${filename}`
      }));
      return res.json({ success: true, source: "local-parser", summary: `Extracted ${scenes.length} key sections from ${filename}`, scenes });
    }

    const prompt = `Analyze this document content from "${filename}" and structure it into a compelling ${targetDuration}-second video storyboard.\nDocument content:\n${documentText.substring(0, 10000)}\n\nReturn JSON with summary, keyPoints and scenes including source traceability.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ text: prompt }],
      config: { responseMimeType: "application/json" }
    });
    res.json({ success: true, source: "gemini-3.7-flash", data: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    console.error("Document extract error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to extract document story" });
  }
});

app.post("/api/ai/enhance-prompt", async (req, res) => {
  try {
    const { originalPrompt, targetMedium = "video" } = req.body;
    const ai = getGenAI();
    if (!ai) {
      return res.json({
        success: true,
        source: "local-template",
        enhancedPrompt: `${originalPrompt}, cinematic composition, professional lighting, clear subject motion and camera direction`,
        changes: ["Added local prompt-structure hints; no AI model was called"]
      });
    }
    const prompt = `Improve this prompt for a generative ${targetMedium} model. Make it cinematic, descriptive, precise in subject, action, lighting, camera movement, and aesthetic quality.\nOriginal Prompt: "${originalPrompt}"\nReturn JSON with enhancedPrompt, subject, action, environment, camera, lighting, style, changes.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ text: prompt }],
      config: { responseMimeType: "application/json" }
    });
    res.json({ success: true, data: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Prompt enhance failed" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HNL Creative AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
