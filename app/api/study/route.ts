 import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const blockedWords = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "porn",
  "sex",
  "nude",
  "xxx",
  "పచ్చి",
  "బూతు",
  "దొంగ",
];

function containsBlockedWord(text: string): boolean {
  const lowerText = text.toLowerCase();

  return blockedWords.some((word) => lowerText.includes(word));
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanWorkflow(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "step" in item &&
        "description" in item
    )
    .map((item) => {
      const workflowItem = item as {
        step?: unknown;
        description?: unknown;
      };

      return {
        step: cleanText(workflowItem.step),
        description: cleanText(workflowItem.description),
      };
    })
    .filter((item) => item.step && item.description);
}

function cleanImages(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "title" in item &&
        "searchTerm" in item &&
        "explanation" in item
    )
    .map((item) => {
      const imageItem = item as {
        title?: unknown;
        searchTerm?: unknown;
        explanation?: unknown;
      };

      return {
        title: cleanText(imageItem.title),
        searchTerm: cleanText(imageItem.searchTerm),
        explanation: cleanText(imageItem.explanation),
      };
    })
    .filter(
      (item) => item.title && item.searchTerm && item.explanation
    );
}

function cleanQuiz(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "question" in item &&
        "options" in item &&
        "answer" in item
    )
    .map((item) => {
      const quizItem = item as {
        question?: unknown;
        options?: unknown;
        answer?: unknown;
      };

      const options = Array.isArray(quizItem.options)
        ? quizItem.options
            .map((option) => {
              if (typeof option === "string") {
                return {
                  text: option.trim(),
                  explanation: "",
                };
              }

              if (
                typeof option === "object" &&
                option !== null &&
                "text" in option
              ) {
                const optionObject = option as {
                  text?: unknown;
                  explanation?: unknown;
                };

                return {
                  text: cleanText(optionObject.text),
                  explanation: cleanText(optionObject.explanation),
                };
              }

              return null;
            })
            .filter(
              (
                option
              ): option is {
                text: string;
                explanation: string;
              } => option !== null && Boolean(option.text)
            )
        : [];

      return {
        question: cleanText(quizItem.question),
        options,
        answer: cleanText(quizItem.answer),
      };
    })
    .filter(
      (item) =>
        item.question &&
        item.options.length === 4 &&
        item.answer &&
        item.options.some((option) => option.text === item.answer)
    );
}

function getTopicWords(topic: string): string[] {
  const ignoredWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "of",
    "in",
    "on",
    "to",
    "for",
    "with",
    "from",
    "about",
    "how",
    "what",
    "is",
    "are",
    "basic",
    "basics",
    "introduction",
    "advanced",
    "intermediate",
  ]);

  return topic
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !ignoredWords.has(word));
}

function isRelevantImage(
  pageTitle: string,
  topic: string,
  searchTerm: string
): boolean {
  const title = pageTitle.toLowerCase();
  const topicWords = getTopicWords(topic);
  const searchWords = getTopicWords(searchTerm);

  if (topicWords.length === 0) return true;

  const matchingTopicWords = topicWords.filter((word) =>
    title.includes(word)
  ).length;

  const matchingSearchWords = searchWords.filter((word) =>
    title.includes(word)
  ).length;

  if (topicWords.length >= 2) {
    return matchingTopicWords >= 2 || matchingSearchWords >= 2;
  }

  return matchingTopicWords >= 1 || matchingSearchWords >= 1;
}

async function searchWikimediaImage(
  topic: string,
  searchTerm: string
) {
  try {
    const combinedSearch = `"${topic}" ${searchTerm}`;

    const apiUrl =
      "https://commons.wikimedia.org/w/api.php?" +
      new URLSearchParams({
        action: "query",
        generator: "search",
        gsrsearch: combinedSearch,
        gsrnamespace: "6",
        gsrlimit: "10",
        prop: "imageinfo",
        iiprop: "url|mime",
        iiurlwidth: "900",
        format: "json",
        origin: "*",
      }).toString();

    const response = await fetch(apiUrl, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = await response.json();
    const pages = data?.query?.pages;

    if (!pages) return null;

    const pageList = Object.values(pages) as {
      title?: string;
      imageinfo?: {
        thumburl?: string;
        url?: string;
        mime?: string;
      }[];
    }[];

    for (const page of pageList) {
      const pageTitle = page.title || "";
      const imageInfo = page.imageinfo?.[0];

      if (!imageInfo) continue;

      if (
        imageInfo.mime &&
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/svg+xml",
        ].includes(imageInfo.mime)
      ) {
        continue;
      }

      if (!isRelevantImage(pageTitle, topic, searchTerm)) {
        continue;
      }

      const imageUrl = imageInfo.thumburl || imageInfo.url;

      if (!imageUrl) continue;

      return {
        imageUrl,
        pageTitle,
        sourceUrl: imageInfo.url || imageUrl,
      };
    }

    return null;
  } catch (error) {
    console.error("Wikimedia image search error:", error);
    return null;
  }
}

function getQuizQuestionCount(difficulty: string): number {
  return difficulty === "Advanced" ? 8 : 5;
}

function getImageInstruction(difficulty: string): string {
  if (difficulty === "Beginner") {
    return `
- Return an empty images array.
- Do not include images for Beginner lessons.
`;
  }

  if (difficulty === "Intermediate") {
    return `
- Return up to 2 image items only when genuinely useful.
- If the topic has only one suitable diagram or image, return only one image item.
- If no suitable image exists, return an empty images array.
- Never add images just to reach a number.
- Every image must directly explain the topic.
`;
  }

  return `
- Return up to 3 image items only when genuinely useful.
- If the topic has only one suitable diagram or image, return only one image item.
- If the topic has no suitable diagram or image, return an empty images array.
- Never add images just to reach a number.
- Every image must directly explain the topic.
- Do not suggest generic, decorative, unrelated, or loosely connected images.
`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const topic = cleanText(body.topic);
    const difficulty = cleanText(body.difficulty) || "Beginner";

    if (!topic) {
      return NextResponse.json(
        {
          error: "Please enter a topic.",
        },
        {
          status: 400,
        }
      );
    }

    if (containsBlockedWord(topic)) {
      return NextResponse.json(
        {
          error:
            "This topic contains inappropriate language. Please enter an educational topic.",
        },
        {
          status: 400,
        }
      );
    }

    const safeDifficulty = [
      "Beginner",
      "Intermediate",
      "Advanced",
    ].includes(difficulty)
      ? difficulty
      : "Beginner";

    const quizQuestionCount = getQuizQuestionCount(safeDifficulty);

    const contentInstructions =
      safeDifficulty === "Beginner"
        ? `
- Use simple language.
- Keep the explanation under 100 words.
- Keep the deepDive under 80 words.
- Return exactly 3 key points.
- Return exactly 2 extra information items.
- Return exactly 2 workflow steps.
- Return an empty images array.
`
        : safeDifficulty === "Intermediate"
        ? `
- Explain the topic with more detail and practical context.
- Include important terms and explain each briefly.
- Keep the explanation under 160 words.
- Keep the deepDive under 180 words.
- Return exactly 5 key points.
- Return exactly 4 extra information items.
- Return exactly 4 workflow steps.
${getImageInstruction(safeDifficulty)}
`
        : `
- Give a detailed, technical explanation.
- Include important terminology, mechanisms, and practical applications.
- Explain limitations or common mistakes.
- Keep the explanation under 220 words.
- Keep the deepDive under 260 words.
- Return exactly 6 key points.
- Return exactly 5 extra information items.
- Return exactly 5 workflow steps.
${getImageInstruction(safeDifficulty)}
`;

    const prompt = `
You are Nova AI Study Assistant.

Create a high-quality educational lesson about:

Topic: ${topic}
Difficulty: ${safeDifficulty}

${contentInstructions}

Return ONLY one valid JSON object.
Do not use Markdown.
Do not use code fences.
Do not add comments outside the JSON object.

Use this exact structure:

{
  "topic": "string",
  "explanation": "string",
  "example": "string",
  "keyPoints": ["string"],
  "extraInformation": ["string"],
  "deepDive": "string",
  "workflow": [
    {
      "step": "string",
      "description": "string"
    }
  ],
  "images": [
    {
      "title": "string",
      "searchTerm": "specific educational Wikimedia Commons search phrase",
      "explanation": "why this exact image is useful for this topic"
    }
  ],
  "quiz": [
    {
      "question": "string",
      "options": [
        {
          "text": "Option A",
          "explanation": "Explain why this option is correct or incorrect."
        },
        {
          "text": "Option B",
          "explanation": "Explain why this option is correct or incorrect."
        },
        {
          "text": "Option C",
          "explanation": "Explain why this option is correct or incorrect."
        },
        {
          "text": "Option D",
          "explanation": "Explain why this option is correct or incorrect."
        }
      ],
      "answer": "exact text of the correct option"
    }
  ]
}

Additional rules:

- Create exactly ${quizQuestionCount} quiz questions.
- Each quiz question must have exactly 4 options.
- Each option must contain a "text" field and an "explanation" field.
- Each explanation must briefly explain why that option is correct or incorrect.
- The answer must exactly match the "text" of the correct option.
- Keep all quiz questions, options, and explanations short.
- Use accurate educational information.
- Do not create conceptual diagrams yourself.
- Use real, specific, educational Wikimedia Commons search terms.
- Image search terms must be directly related to the topic: "${topic}".
- Do not use generic image terms such as "education", "technology", "science", "diagram", or "learning" alone.
- Do not include inappropriate content.
- Use double quotes for all JSON keys and string values.
- Do not include trailing commas.
- Return only the JSON object.
`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.2,
      max_tokens: 8000,
      messages: [
        {
          role: "system",
          content:
            "You are Nova AI Study Assistant. Return only one valid JSON object. Never use Markdown or code fences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;

    if (!rawContent || typeof rawContent !== "string") {
      throw new Error("No valid response was received from Groq.");
    }

    let generatedData: Record<string, unknown>;

    try {
      generatedData = JSON.parse(rawContent);
    } catch {
      throw new Error("Nova returned invalid JSON. Please try again.");
    }

    const imageRequests = cleanImages(generatedData.images);

    const images = await Promise.all(
      imageRequests.map(async (image) => {
        const result = await searchWikimediaImage(
          topic,
          image.searchTerm
        );

        if (!result) return null;

        return {
          title: image.title,
          explanation: image.explanation,
          imageUrl: result.imageUrl,
          sourceUrl: result.sourceUrl,
          sourceTitle: result.pageTitle,
        };
      })
    );

    const cleanedQuiz = cleanQuiz(generatedData.quiz);

    const finalQuiz = cleanedQuiz.slice(0, quizQuestionCount);

    return NextResponse.json({
      assistantName: "Nova AI Study Assistant",
      topic: cleanText(generatedData.topic) || topic,
      difficulty: safeDifficulty,
      explanation: cleanText(generatedData.explanation),
      example: cleanText(generatedData.example),
      keyPoints: cleanStringArray(generatedData.keyPoints),
      extraInformation: cleanStringArray(generatedData.extraInformation),
      deepDive: cleanText(generatedData.deepDive),
      workflow: cleanWorkflow(generatedData.workflow),
      images: images.filter(Boolean),
      quiz: finalQuiz,
    });
  } catch (error) {
    console.error("Nova Study API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating your study material.",
      },
      {
        status: 500,
      }
    );
  }
}