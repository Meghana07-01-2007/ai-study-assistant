 import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const blockedPatterns = [
  // Adult / sexual content
  /\bsex\b/i,
  /\bsexual\b/i,
  /\bporn\b/i,
  /\bpornography\b/i,
  /\bxxx\b/i,
  /\bnsfw\b/i,
  /\bnude\b/i,
  /\bnudity\b/i,
  /\bnaked\b/i,
  /\berotic\b/i,
  /\bhentai\b/i,
  /\bonlyfans\b/i,
  /\bintercourse\b/i,
  /\bblowjob\b/i,

  // Vulgar / abusive language
  /\bfuck\b/i,
  /\bfucking\b/i,
  /\bshit\b/i,
  /\bbitch\b/i,
  /\basshole\b/i,
  /\bcunt\b/i,
  /\bslut\b/i,
  /\bwhore\b/i,
  /\bdick\b/i,
  /\bpussy\b/i,
];

function containsBlockedContent(text: string) {
  return blockedPatterns.some((pattern) => pattern.test(text));
}

export async function POST(request: Request) {
  try {
    const { topic, difficulty } = await request.json();

    // Check that topic exists
    if (!topic?.trim()) {
      return NextResponse.json(
        { error: "Please enter a topic to learn." },
        { status: 400 }
      );
    }

    // Block inappropriate topics before sending them to the AI
    if (containsBlockedContent(topic)) {
      return NextResponse.json(
        {
          error:
            "This topic isn't suitable for the AI Study Assistant. Please choose an educational topic such as science, mathematics, technology, history, or programming.",
        },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY is missing. Please check your .env.local file.",
        },
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
          content: `
You are a safe AI study tutor for students.

Your job is to teach academic and educational subjects clearly,
accurately, and appropriately for students.

SAFETY RULES:
- Do not generate adult or 18+ content.
- Do not generate sexual or explicit content.
- Do not generate pornography or erotic content.
- Do not generate vulgar, profane, or obscene language.
- Do not generate inappropriate jokes or examples.
- Do not provide instructions for inappropriate activities.
- If the requested topic is inappropriate, return a safe refusal.
- Keep examples suitable for a school/college learning environment.

Only create educational content such as:
- Mathematics
- Science
- Physics
- Chemistry
- Biology
- Computer Science
- Programming
- Artificial Intelligence
- History
- Geography
- Economics
- Languages
- General academic subjects

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

The answer must exactly match one of the options.
`,
        },
        {
          role: "user",
          content: `
Teach me about "${topic}".

Difficulty level: ${difficulty}

Create:
- A simple explanation
- One real-world educational example
- Three important points to remember
- Three multiple-choice quiz questions

Everything must be appropriate for students.
Do not include adult, sexual, explicit, vulgar, or inappropriate content.
`,
        },
      ],

      temperature: 0.5,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty response.");
    }

    // Parse AI response
    let studyData;

    try {
      studyData = JSON.parse(content);
    } catch {
      console.error("Groq returned invalid JSON:", content);

      throw new Error("AI returned an invalid response format.");
    }

    // Extra safety check on AI-generated content
    const generatedText = JSON.stringify(studyData);

    if (containsBlockedContent(generatedText)) {
      return NextResponse.json(
        {
          error:
            "The AI generated content that isn't suitable for this study assistant. Please try another educational topic.",
        },
        { status: 400 }
      );
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
            : "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}