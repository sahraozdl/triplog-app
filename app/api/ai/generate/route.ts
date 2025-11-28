import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Server Configuration Error: GEMINI_API_KEY is missing.");
      return NextResponse.json(
        { error: "Server Configuration Error: GEMINI_API_KEY is missing." },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const body = await req.json();
    const { action, context, timeRange, selectedTags } = body;

    console.log(`AI Request Received: ${action}`);

    if (action === "suggest_tags") {
      const prompt = `
        You are a work logger assistant. The user selected: "${context}".
        Suggest 4 related, short professional tags (max 3 words).
        Return ONLY a JSON array. Example: ["code review", "debugging"]
        Do not use markdown formatting.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let tags = [];
      try {
        tags = JSON.parse(text);
      } catch (e) {
        console.error("AI Response JSON Parse Error:", text);
        return NextResponse.json({ tags: [] });
      }

      return NextResponse.json({ tags });
    }

    if (action === "generate_description") {
      const prompt = `
        Write a 1-sentence professional work log description based on these details:
        Time Range: ${timeRange}
        Activities: ${selectedTags.join(", ")}
        Tone: Formal and direct. 
        Example Output: "Implemented new features for the user dashboard and fixed layout bugs."
        Return ONLY the text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const description = response.text().trim();

      return NextResponse.json({ description });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("AI Service Error:", error.message || error);
    return NextResponse.json(
      { error: "AI Service Failed", details: error.message },
      { status: 500 },
    );
  }
}
