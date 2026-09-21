 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type QuizOption =
  | string
  | {
      text?: string;
      explanation?: string;
    };

type QuizQuestion = {
  question?: string;
  options?: QuizOption[];
  answer?: string;
  explanation?: string;
};

function getOptionText(option: QuizOption): string {
  if (typeof option === "string") {
    return option;
  }

  return option.text || "";
}

function getOptionExplanation(option: QuizOption): string {
  if (typeof option === "string") {
    return "";
  }

  return option.explanation || "";
}

export default function QuizPage() {
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const savedQuiz = sessionStorage.getItem("novaQuiz");

    if (!savedQuiz) {
      return;
    }

    try {
      const parsedQuiz = JSON.parse(savedQuiz);

      if (Array.isArray(parsedQuiz) && parsedQuiz.length > 0) {
        setQuiz(parsedQuiz);
      }
    } catch {
      setQuiz([]);
    }
  }, []);

  if (quiz.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1020] p-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold">No quiz found</h1>

          <p className="mt-3 text-slate-300">
            Please generate study material first.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-[#8B5CF6] px-6 py-3 font-semibold transition hover:bg-[#7C3AED]"
          >
            Go Back Home
          </button>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1020] p-6 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-[#172033] p-8 text-center">
          <h1 className="text-4xl font-bold">Quiz Complete 🎉</h1>

          <p className="mt-5 text-xl text-slate-300">
            Your score: {score} / {quiz.length}
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-8 rounded-xl bg-[#8B5CF6] px-6 py-3 font-bold transition hover:bg-[#7C3AED]"
          >
            Study Another Topic
          </button>
        </div>
      </main>
    );
  }

  const currentQuestion = quiz[currentIndex];
  const options = currentQuestion.options || [];

  function selectAnswer(answer: string) {
    if (showExplanation) {
      return;
    }

    setSelectedAnswer(answer);

    if (answer === currentQuestion.answer) {
      setScore((previousScore) => previousScore + 1);
    }

    setShowExplanation(true);
  }

  function nextQuestion() {
    if (currentIndex === quiz.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedAnswer("");
    setShowExplanation(false);
  }

  const selectedOption = options.find(
    (option) => getOptionText(option) === selectedAnswer
  );

  const selectedOptionExplanation = selectedOption
    ? getOptionExplanation(selectedOption)
    : "";

  const questionExplanation = currentQuestion.explanation || "";

  const explanation =
    selectedOptionExplanation || questionExplanation;

  const isCorrect = selectedAnswer === currentQuestion.answer;

  return (
    <main className="min-h-screen bg-[#0B1020] px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#5EEAD4]">
          Question {currentIndex + 1} of {quiz.length}
        </p>

        <section className="rounded-3xl border border-slate-700 bg-[#172033] p-8">
          <h1 className="text-2xl font-bold">
            {currentQuestion.question || "Question unavailable"}
          </h1>

          <div className="mt-6 space-y-3">
            {options.map((option, index) => {
              const optionText = getOptionText(option);

              if (!optionText.trim()) {
                return null;
              }

              const isSelected = selectedAnswer === optionText;

              return (
                <button
                  key={`${currentIndex}-${index}`}
                  type="button"
                  disabled={showExplanation}
                  onClick={() => selectAnswer(optionText)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-[#5EEAD4] bg-[#5EEAD4] text-[#0B1020]"
                      : "border-slate-600 bg-[#0B1020] hover:border-[#8B5CF6]"
                  } ${
                    showExplanation
                      ? "cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <span className="mr-3 font-bold">
                    {String.fromCharCode(65 + index)}.
                  </span>

                  <span>{optionText}</span>
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="mt-6 rounded-xl border border-slate-600 bg-[#0B1020] p-4">
              <p className="font-bold">
                {isCorrect
                  ? "Correct! 🎉"
                  : "Not quite. Keep learning!"}
              </p>

              <p className="mt-3 text-slate-300">
                {explanation || "No explanation available for this answer."}
              </p>

              {!isCorrect && (
                <p className="mt-3 text-[#5EEAD4]">
                  Correct answer:{" "}
                  {currentQuestion.answer || "Unavailable"}
                </p>
              )}

              <button
                type="button"
                onClick={nextQuestion}
                className="mt-5 rounded-xl bg-[#8B5CF6] px-5 py-3 font-bold transition hover:bg-[#7C3AED]"
              >
                {currentIndex === quiz.length - 1
                  ? "Finish Quiz"
                  : "Next Question →"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}