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

function cleanImageQueries(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const queries = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((item) => {
      const words = item.split(" ");
      return words.length >= 2 && words.length <= 5;
    });

  return [...new Set(queries)];
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
    const cleanSearchTerm = searchTerm.trim().replace(/\s+/g, " ");
    const searchCandidates = [
      `"${topic}" "${cleanSearchTerm}"`,
      `${cleanSearchTerm} ${topic}`,
      cleanSearchTerm,
      topic,
    ];

    const seenTitles = new Set<string>();

    for (const combinedSearch of searchCandidates) {
      const apiUrl =
        "https://commons.wikimedia.org/w/api.php?" +
        new URLSearchParams({
          action: "query",
          generator: "search",
          gsrsearch: combinedSearch,
          gsrnamespace: "6",
          gsrlimit: "20",
          prop: "imageinfo",
          iiprop: "url|mime",
          iiurlwidth: "1000",
          format: "json",
          origin: "*",
        }).toString();

      const response = await fetch(apiUrl, {
        cache: "no-store",
      });

      if (!response.ok) continue;

      const data = await response.json();
      const pages = data?.query?.pages;
      if (!pages) continue;

      const pageList = Object.values(pages) as {
        title?: string;
        imageinfo?: {
          thumburl?: string;
          url?: string;
          mime?: string;
        }[];
      }[];

      const topicWords = getTopicWords(topic);
      const searchWords = getTopicWords(cleanSearchTerm);

      const candidates = pageList
        .map((page) => {
          const pageTitle = page.title || "";
          const imageInfo = page.imageinfo?.[0];

          if (!imageInfo || seenTitles.has(pageTitle)) return null;

          if (
            imageInfo.mime &&
            ![
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/svg+xml",
            ].includes(imageInfo.mime)
          ) {
            return null;
          }

          const title = pageTitle.toLowerCase();
          const topicMatches = topicWords.filter((word) =>
            title.includes(word)
          ).length;
          const searchMatches = searchWords.filter((word) =>
            title.includes(word)
          ).length;

          // Strong preference for exact concept matches, but do not reject
          // a useful Wikimedia image just because its title uses different wording.
          const score =
            searchMatches * 5 +
            topicMatches * 3 +
            (title.includes(cleanSearchTerm.toLowerCase()) ? 8 : 0);

          const imageUrl = imageInfo.thumburl || imageInfo.url;
          if (!imageUrl) return null;

          return {
            imageUrl,
            pageTitle,
            sourceUrl: imageInfo.url || imageUrl,
            score,
          };
        })
        .filter(Boolean) as {
        imageUrl: string;
        pageTitle: string;
        sourceUrl: string;
        score: number;
      }[];

      candidates.sort((a, b) => b.score - a.score);

      if (candidates.length > 0) {
        const best = candidates[0];
        seenTitles.add(best.pageTitle);

        return {
          imageUrl: best.imageUrl,
          pageTitle: best.pageTitle,
          sourceUrl: best.sourceUrl,
        };
      }
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
- Return an empty imageQueries array.
- Do not include images for Beginner lessons.
`;
  }

  if (difficulty === "Intermediate") {
    return `
- Return exactly 3 image items.
- Return exactly 3 imageQueries.
- Each image searchTerm/query must be 2-5 words, concrete, specific, and directly tied to a concept explained in the lesson.
- Prefer labeled diagrams, structures, charts, mechanisms, timelines, or process flows.
- Do not use generic terms such as "science", "technology", "education", "diagram", or "learning".
- Never repeat an image searchTerm/query.
- Every image must directly explain a different important concept from the lesson.
`;
  }

  return `
- Return exactly 4 image items.
- Return exactly 4 imageQueries.
- Each image searchTerm/query must be 2-5 words, concrete, specific, and directly tied to a concept explained in the lesson.
- Prefer detailed labeled diagrams, structures, charts, mechanisms, timelines, or process flows.
- Do not use generic terms such as "science", "technology", "education", "diagram", or "learning".
- Never repeat an image searchTerm/query.
- Every image must directly explain a different important concept from the lesson.
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
  "imageQueries": ["2-5 word specific query"],
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
- Image search terms and imageQueries must be directly related to the topic: "${topic}".
- Each image search term/query must contain 2-5 meaningful words.
- Prefer the exact concept name plus a concrete visual noun, such as "mitochondria structure labeled" or "TCP three way handshake".
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

    const generatedImageRequests = cleanImages(generatedData.images);
    const generatedImageQueries = cleanImageQueries(generatedData.imageQueries);

    const generatedKeyPoints = cleanStringArray(generatedData.keyPoints);

    const fallbackQueries =
      safeDifficulty === "Intermediate"
        ? generatedKeyPoints.slice(0, 3)
        : generatedKeyPoints.slice(0, 4);

    const queryList = [
      ...generatedImageQueries,
      ...generatedImageRequests.map((image) => image.searchTerm),
      ...fallbackQueries,
    ]
      .map((query) => query.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .filter((query) => {
        const words = query.split(" ");
        return words.length >= 2 && words.length <= 5;
      })
      .filter((query, index, array) => array.indexOf(query) === index);

    const requiredImageCount =
      safeDifficulty === "Intermediate"
        ? 3
        : safeDifficulty === "Advanced"
          ? 4
          : 0;

    const imageQueries = queryList.slice(0, requiredImageCount);

    const images = await Promise.all(
      imageQueries.map(async (searchTerm) => {
        const result = await searchWikimediaImage(topic, searchTerm);

        if (!result) return null;

        const matchingGeneratedImage = generatedImageRequests.find(
          (image) =>
            image.searchTerm.toLowerCase() === searchTerm.toLowerCase()
        );

        return {
          title:
            matchingGeneratedImage?.title ||
            searchTerm.replace(/\b\w/g, (letter) => letter.toUpperCase()),
          explanation:
            matchingGeneratedImage?.explanation ||
            `This image visually explains the concept "${searchTerm}" in the ${safeDifficulty.toLowerCase()} lesson.`,
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
      imageQueries,
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