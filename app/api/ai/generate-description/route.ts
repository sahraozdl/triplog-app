import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getTripDescription } from "@/lib/utils/getTripDescription";

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
    const {
      selectedTags,
      fullText,
      selectedText,
      tripId,
      tripDescription,
      jobTitle,
    } = body;

    console.log("AI Request Received: generate_description");

    // Get trip description if available
    const tripDesc = await getTripDescription(tripId, tripDescription);

    const tags = selectedTags || [];
    const tagList = tags.map((tag: string) => tag.trim()).filter(Boolean);

    let prompt = `Use tripInfo, jobTitle, and tags only as background context and do not mention or refer to them directly in the text.
Describe only what was done during the work time, without explanations, introductions, or justifications.
Write in an impersonal, factual tone suitable for official submission to the Swedish Tax Agency (Skatteverket).
Do not use first-person language, job titles, or narrative phrases.

Background context (use for understanding only, do not mention in output):
Trip Info: ${tripDesc || "Not provided"}
Job Title: ${jobTitle || "Not provided"}
Tags: ${tagList.length > 0 ? tagList.join(", ") : "Not provided"}`;

    if (fullText && selectedText) {
      prompt += `

The user has selected a specific portion to regenerate:
- Full existing text: "${fullText}"
- Selected portion to regenerate: "${selectedText}"

Generate a replacement for the selected portion only, following the same style guidelines.`;
    } else if (fullText) {
      prompt += `

Existing text: "${fullText}"

Generate a replacement for the entire text, following the same style guidelines.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 150,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "generate_description_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description:
                  "A brief, concise work description (1-2 sentences maximum)",
              },
            },
            required: ["description"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ description: "" });
    }

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({ description: parsed.description || "" });
    } catch (e) {
      console.error("AI Response JSON Parse Error:", content);
      return NextResponse.json({ description: "" });
    }
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
