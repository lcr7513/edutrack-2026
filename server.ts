import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Academic Consultant & Plan Optimization
app.post("/api/ai/optimize-plan", async (req: Request, res: Response) => {
  try {
    const { subjects, goals, weeklyHours, targetExam, weakAreas, userPrompt } = req.body;
    const ai = getGemini();

    const systemPrompt = `당신은 최고 수준의 학업 계획 및 학습 코칭 전문가 'EduTrack AI 컨설턴트'입니다.
학생의 과목, 학습 목표, 주당 학습 가능 시간, 목표 시험 일정, 취약 과목 정보를 바탕으로 실현 가능하고 체계적인 학업 계획 및 조언을 한국어로 작성해주세요.
반드시 JSON 형식으로 응답하세요:
{
  "summary": "학업 계획 요약 및 총평",
  "strategies": ["주요 학습 전략 1", "주요 학습 전략 2", "주요 학습 전략 3"],
  "weeklyDistribution": [
    { "subject": "과목명", "recommendedHours": 5, "focusTopic": "핵심 집중 주제", "method": "추천 공부법" }
  ],
  "milestones": [
    { "timeframe": "1~2주차", "goal": "기본 개념 완성 및 취약점 보완", "actionItems": ["개념서 1회독", "오답노트 정리"] }
  ],
  "customAdvice": "동기부여 및 슬럼프 극복 팁"
}`;

    const promptText = `
학생 학업 데이터:
- 현재 목표: ${goals || "학업 성적 향상 및 체계적 플랜 수립"}
- 등록된 과목: ${JSON.stringify(subjects || [])}
- 주당 가용 학습시간: ${weeklyHours || 20}시간
- 다가오는 주요 시험/일정: ${targetExam || "중간/기말고사"}
- 취약/집중 영역: ${weakAreas || "없음"}
- 추가 요청사항: ${userPrompt || "균형 잡힌 주간 학업 분배 계획을 제안해주세요."}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n${promptText}` }] }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("AI Plan Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error?.message || "AI 학업 계획 생성 중 오류가 발생했습니다." 
    });
  }
});

// AI Quick Study Helper (과목별 문제 해결 / 암기 팁 / 학습 피드백)
app.post("/api/ai/study-coach", async (req: Request, res: Response) => {
  try {
    const { question, subject, currentProgress } = req.body;
    const ai = getGemini();

    const prompt = `당신은 친절하고 명쾌한 EduTrack 학습 멘토입니다.
과목: ${subject || "일반"}
현재 학습 현황: ${currentProgress || "진행 중"}
학생 질문/고민: ${question}

학생이 바로 실천할 수 있는 핵심적인 학습 요령, 개념 구조화 팁, 또는 학습 가이드를 명확하고 따뜻하게 3~4개 단락으로 답변해주세요. 마크다운 형식으로 작성해주세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
      }
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("AI Coach Error:", error);
    res.status(500).json({ success: false, error: error?.message || "AI 코칭 응답 생성 실패" });
  }
});

async function startServer() {
  // Vite middleware setup for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduTrack server running on http://localhost:${PORT}`);
  });
}

startServer();
