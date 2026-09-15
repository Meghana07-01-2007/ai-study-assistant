 import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { topic, difficulty } = await request.json();

    if (!topic?.trim()) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing. Check your .env.local file." },
        { status: 500 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `You are an AI study tutor.

Your job is to teach students clearly and accurately.

Always return ONLY valid JSON.
Do not use markdown.
Do not add text before or after the JSON.

The JSON must have exactly these fields:
{
  "explanation": "string",
  "example": "string",
  "keyPoints": ["string", "string", "string"],
  "quiz": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    }
  ]
}

Create exactly 3 quiz questions.
Each question must have exactly 4 options.
The answer must exactly match one of the options.`,
        },
        {
          role: "user",
          content: `Teach me about "${topic}".

Difficulty level: ${difficulty}

Create:
- A simple explanation
- One real-world example
- Three important points to remember
- Three multiple-choice quiz questions

Make everything appropriate for a student and match the requested difficulty.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty response.");
    }

    let studyData;

    try {
      studyData = JSON.parse(content);
    } catch {
      console.error("Groq returned invalid JSON:", content);
      throw new Error("AI returned an invalid response format.");
    }

    return NextResponse.json(studyData);
  } catch (error) {
    console.error("========== GROQ ERROR ==========");
    console.error(error);
    console.error("================================");

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown backend error",
      },
      { status: 500 }
    );
  }
}