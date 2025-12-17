import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Server Configuration Error: OPENAI_API_KEY is missing.");
      return NextResponse.json(
        { error: "Server Configuration Error: OPENAI_API_KEY is missing." },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey });

    const body = await req.json();
    const { action, context, timeRange, selectedTags, fullText, selectedText } =
      body;

    console.log(`AI Request Received: ${action}`);

    if (action === "suggest_tags") {
      const prompt = `
        You are a work logger assistant. The user selected: "${context}".
        Suggest 4 related, short professional tags (max 3 words).
        Return ONLY a JSON array. Example: ["code review", "debugging"]
        Do not use markdown formatting.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      let text = completion.choices[0]?.message?.content || "";

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
      const timeMatch = timeRange?.match(
        /(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/,
      );
      let duration = "";
      if (timeMatch) {
        const startHours = parseInt(timeMatch[1]);
        const startMinutes = parseInt(timeMatch[2]);
        const endHours = parseInt(timeMatch[3]);
        const endMinutes = parseInt(timeMatch[4]);
        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;
        const diffMinutes = endTotal - startTotal;
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        if (hours > 0 && minutes > 0) {
          duration = `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minute${minutes > 1 ? "s" : ""}`;
        } else if (hours > 0) {
          duration = `${hours} hour${hours > 1 ? "s" : ""}`;
        } else {
          duration = `${minutes} minute${minutes > 1 ? "s" : ""}`;
        }
      }

      const tags = selectedTags || [];
      const tagList = tags.map((tag: string) => tag.trim()).filter(Boolean);

      let prompt = `You are a professional work log assistant. Your task is to generate a realistic, human-like work description that accurately reflects the activities performed during the specified time period.

CONTEXT:
- Time Range: ${timeRange}${duration ? ` (Duration: ${duration})` : ""}
- Tags/Activities: ${tagList.length > 0 ? tagList.join(", ") : "General work activities"}`;

      if (fullText && selectedText) {
        prompt += `

SURROUNDING CONTEXT:
The user has existing work log text. They have selected a specific portion to regenerate:
- Full existing text: "${fullText}"
- Selected portion to regenerate: "${selectedText}"

INSTRUCTIONS:
1. Analyze the selected tags and understand what activities they represent
2. Consider the time duration - activities should be realistic for that time period
3. Generate a description ONLY for the selected portion that:
   - Matches the tone and style of the surrounding text
   - Is contextually consistent with the rest of the work log
   - Reflects realistic work activities for the time range
   - Uses natural, professional language (not overly formal or robotic)
4. The output should seamlessly fit into the existing text structure
5. Return ONLY the replacement text for the selected portion, without any additional commentary`;
      } else if (fullText) {
        prompt += `

EXISTING TEXT:
"${fullText}"

INSTRUCTIONS:
1. Analyze the tags and understand what activities they represent
2. Consider the time duration - activities should be realistic for that time period
3. Generate a complete work description that:
   - Incorporates all the tags naturally
   - Reflects realistic work activities for the time range
   - Uses natural, professional language (not overly formal or robotic)
   - Provides specific, concrete details about what was accomplished
4. The description should sound like a real person wrote it about their actual work
5. Return ONLY the work description text, without any additional commentary`;
      } else {
        prompt += `

INSTRUCTIONS:
1. Analyze the tags and understand what activities they represent
2. Consider the time duration - activities should be realistic for that time period
3. Generate a complete work description that:
   - Incorporates all the tags naturally
   - Reflects realistic work activities for the time range
   - Uses natural, professional language (not overly formal or robotic)
   - Provides specific, concrete details about what was accomplished
4. The description should sound like a real person wrote it about their actual work
5. Return ONLY the work description text, without any additional commentary`;
      }

      prompt += `

EXAMPLES OF GOOD DESCRIPTIONS:
- "Reviewed and merged pull requests for the authentication module, then updated API documentation for the new endpoints."
- "Attended sprint planning meeting to discuss Q4 roadmap, followed by refactoring the user profile component to improve performance."
- "Fixed critical bug in payment processing flow that was causing transaction failures, and wrote unit tests to prevent regression."

EXAMPLES OF BAD DESCRIPTIONS (avoid these):
- "Did coding and meetings." (too vague)
- "Performed various software development tasks." (generic, no specifics)
- "Worked on project-related activities." (meaningless)

Now generate the work description:`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 500,
      });

      const description = completion.choices[0]?.message?.content?.trim() || "";

      return NextResponse.json({ description });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("AI Service Error:", errorMessage);
    return NextResponse.json(
      { error: "AI Service Failed", details: errorMessage },
      { status: 500 },
    );
  }
}
