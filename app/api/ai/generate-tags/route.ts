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
    const { context, tripId, tripDescription, jobTitle } = body;

    console.log("AI Request Received: suggest_tags");

    // Get trip description if available
    const tripDesc = await getTripDescription(tripId, tripDescription);
    const tripContext = tripDesc
      ? `\n\nTRIP CONTEXT:\nThis work log is part of a trip with the following description: "${tripDesc}". When generating tags or descriptions, consider how the activities relate to this trip context.`
      : "";

    const jobTitleContext = jobTitle
      ? `\n\nJOB TITLE CONTEXT:\nThe user's job title is "${jobTitle}". When generating tags or descriptions, consider activities and terminology relevant to this role.`
      : "";

    const prompt = `You are a work logger assistant. The user selected: "${context}".${tripContext}${jobTitleContext}

Suggest 4 related, short professional tags (max 3 words) that are relevant to the selected context${tripDesc ? " and the trip description" : ""}${jobTitle ? ` and appropriate for someone with the job title "${jobTitle}"` : ""}.
Return a JSON array of exactly 4 tags. Example: ["code review", "debugging", "testing", "documentation"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "suggest_tags_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tags: {
                type: "array",
                items: {
                  type: "string",
                },
                minItems: 4,
                maxItems: 4,
              },
            },
            required: ["tags"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ tags: [] });
    }

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({ tags: parsed.tags || [] });
    } catch (e) {
      console.error("AI Response JSON Parse Error:", content);
      return NextResponse.json({ tags: [] });
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
