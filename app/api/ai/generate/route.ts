import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { connectToDB } from "@/lib/mongodb";
import Trip from "@/app/models/Trip";

async function getTripDescription(
  tripId?: string,
  tripDescription?: string,
): Promise<string> {
  if (tripDescription) {
    return tripDescription;
  }

  if (tripId) {
    try {
      await connectToDB();
      const trip = await Trip.findById(tripId);
      if (trip?.basicInfo?.description) {
        return trip.basicInfo.description;
      }
    } catch (error) {
      console.error("Error fetching trip description:", error);
    }
  }

  return "";
}

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
      action,
      context,
      timeRange,
      selectedTags,
      fullText,
      selectedText,
      tripId,
      tripDescription,
      jobTitle,
    } = body;

    console.log(`AI Request Received: ${action}`);

    // Get trip description if available
    const tripDesc = await getTripDescription(tripId, tripDescription);
    const tripContext = tripDesc
      ? `\n\nTRIP CONTEXT:\nThis work log is part of a trip with the following description: "${tripDesc}". When generating tags or descriptions, consider how the activities relate to this trip context.`
      : "";

    const jobTitleContext = jobTitle
      ? `\n\nJOB TITLE CONTEXT:\nThe user's job title is "${jobTitle}". When generating tags or descriptions, consider activities and terminology relevant to this role.`
      : "";

    if (action === "suggest_tags") {
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
    }

    if (action === "generate_description") {
      const tags = selectedTags || [];
      const tagList = tags.map((tag: string) => tag.trim()).filter(Boolean);

      let prompt = `You are a professional work log assistant. Generate a concise, brief work description based on the provided tags.${tripContext}${jobTitleContext}

IMPORTANT RULES ABOUT SIX-DIGIT CLASS IDENTIFIERS:
- Six-digit numbers (format: MMDDYY, e.g., 110425 = 11/04/2025) are class identifiers
- ONLY include a class identifier in your output if the user explicitly provided one in their tags/input
- Do NOT invent, add, or include any class identifiers that are not present in the user's input
- If the user's tags contain a six-digit number, preserve it exactly as provided (six digits, no separators)
- The number "110425" mentioned in examples below is ONLY an example - do NOT use it unless the user explicitly provides it

CONTEXT:
- Tags/Activities: ${tagList.length > 0 ? tagList.join(", ") : "General work activities"}${jobTitle ? `\n- Job Title: ${jobTitle}` : ""}`;

      if (fullText && selectedText) {
        prompt += `

SURROUNDING CONTEXT:
The user has existing work log text. They have selected a specific portion to regenerate:
- Full existing text: "${fullText}"
- Selected portion to regenerate: "${selectedText}"

INSTRUCTIONS:
1. Generate a brief, concise description ONLY for the selected portion${tripDesc ? " that relates to the trip context when relevant" : ""}${jobTitle ? ` using terminology and activities appropriate for a ${jobTitle}` : ""}
2. Keep it short - 1-2 sentences maximum
3. Match the tone and style of the surrounding text
4. Do NOT mention time ranges or hours worked
5. Do NOT add unnecessary phrases like "Conducted", "During the trip", or "Worked on" - be direct and concise
6. ONLY include six-digit class identifiers if they are explicitly present in the user's tags/input - do NOT invent or add any group numbers
7. If a six-digit number is in the user's input, preserve it exactly as provided (e.g., 110425, not "class 110425" or "11/04/2025")
8. Return ONLY the replacement text, no additional commentary`;
      } else if (fullText) {
        prompt += `

EXISTING TEXT:
"${fullText}"

INSTRUCTIONS:
1. Generate a brief, concise work description${tripDesc ? " that relates to the trip context when relevant" : ""}${jobTitle ? ` using terminology and activities appropriate for a ${jobTitle}` : ""}
2. Keep it short - 1-2 sentences maximum
3. Incorporate the tags naturally but briefly
4. Do NOT mention time ranges or hours worked
5. Do NOT add unnecessary phrases like "Conducted", "During the trip", or "Worked on" - be direct and concise
6. ONLY include six-digit class identifiers if they are explicitly present in the user's tags/input - do NOT invent or add any group numbers
7. If a six-digit number is in the user's input, preserve it exactly as provided (e.g., 110425, not "class 110425" or "11/04/2025")
8. Return ONLY the work description text, no additional commentary`;
      } else {
        prompt += `

INSTRUCTIONS:
1. Generate a brief, concise work description${tripDesc ? " that relates to the trip context when relevant" : ""}${jobTitle ? ` using terminology and activities appropriate for a ${jobTitle}` : ""}
2. Keep it short - 1-2 sentences maximum
3. Incorporate the tags naturally but briefly
4. Do NOT mention time ranges or hours worked
5. Do NOT add unnecessary phrases like "Conducted", "During the trip", or "Worked on" - be direct and concise
6. ONLY include six-digit class identifiers if they are explicitly present in the user's tags/input - do NOT invent or add any group numbers
7. If a six-digit number is in the user's input, preserve it exactly as provided (e.g., 110425, not "class 110425" or "11/04/2025")
8. Return ONLY the work description text, no additional commentary`;
      }

      prompt += `

EXAMPLES OF GOOD DESCRIPTIONS (brief and concise):
- "Reviewed pull requests and updated API documentation."
- "Attended sprint planning meeting and refactored user profile component."
- "Fixed payment processing bug and wrote unit tests."
- "Code review for 110425." (NOTE: This example assumes the user's input contained "110425". If the user only provided "code review" without a number, the output should be "Code review" without any group number)

EXAMPLES OF BAD DESCRIPTIONS (avoid these):
- "Did coding and meetings." (too vague)
- "Worked for 8 hours on various software development tasks including coding, debugging, and testing." (too long, mentions hours)
- "Performed various software development tasks." (generic)
- "Code review for 110425." (WRONG if the user only provided "code review" - do NOT add group numbers that weren't in the user's input)
- "Conducted code review for project 200825 during the trip." (too verbose, adds unnecessary words like "Conducted" and "during the trip", and incorrectly calls it a "project" instead of recognizing it as a class identifier)
- "Code review for class 110425." (unnecessarily adds "class" - just use "Code review for 110425" if the number was in the input)
- "Reviewed code, commented on submissions, helped students, and shared knowledge with class 110425." (too explicit - the concise version "Code review for 110425" implies all of this, but only if the number was in the user's input)

Now generate the brief work description:`;

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
