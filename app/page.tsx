 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateStudyMaterial() {
    if (!topic.trim()) {
      setError("Please enter a topic to begin your learning journey.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      sessionStorage.removeItem("novaStudyData");
      sessionStorage.removeItem("novaQuiz");

      const response = await fetch("/api/study", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.quiz || !Array.isArray(data.quiz) || data.quiz.length === 0) {
        throw new Error("The server returned no quiz questions.");
      }

      sessionStorage.setItem("novaStudyData", JSON.stringify(data));
      sessionStorage.setItem("novaQuiz", JSON.stringify(data.quiz));

      router.push("/study");
     } catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : "Unable to connect to the study assistant."
  );
} finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F4EA] px-5 py-10 text-[#1F2933] sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="text-center">

          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-7xl">
            Learn smarter.
            <br />
            Grow <span className="text-[#166534]">stronger.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#64748B]">
            Explore new topics with AI-powered explanations, practical
            examples, useful learning notes, and interactive quizzes.
          </p>
        </header>

        {/* Main learning card */}
        <section className="mx-auto mt-12 max-w-3xl rounded-[2rem] border border-[#D6D3C8] bg-white p-6 shadow-xl sm:p-10">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#CA8A04]">
              Start your lesson
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              What do you want to learn?
            </h2>
          </div>

          <label className="mt-8 block text-sm font-bold text-[#374151]">
            Enter a topic
          </label>

          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !loading) {
                generateStudyMaterial();
              }
            }}
            placeholder="Example: Artificial Intelligence"
            className="mt-2 w-full rounded-2xl border border-[#D1D5DB] bg-[#FAFAF7] px-5 py-4 text-[#1F2933] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20"
          />

          <label className="mt-7 block text-sm font-bold text-[#374151]">
            Select your learning level
          </label>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {["Beginner", "Intermediate", "Advanced"].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`rounded-2xl border px-4 py-4 font-bold transition ${
                  difficulty === level
                    ? "border-[#166534] bg-[#166534] text-white shadow-lg"
                    : "border-[#D1D5DB] bg-[#FAFAF7] text-[#64748B] hover:border-[#166534] hover:text-[#166534]"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={generateStudyMaterial}
            disabled={loading}
            className="mt-8 w-full rounded-2xl bg-[#CA8A04] px-6 py-4 font-black text-white shadow-lg transition hover:bg-[#A16207] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating your lesson..." : "Begin Learning →"}
          </button>
        </section>

        {/* Feature boxes */}
        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-[#D6D3C8] bg-white p-6 shadow-sm">
            <div className="text-3xl">📘</div>
            <h3 className="mt-4 text-xl font-black text-[#166534]">
              AI Explanations
            </h3>
            <p className="mt-3 leading-7 text-[#64748B]">
              Understand difficult ideas through clear, structured lessons.
            </p>
          </div>

          <div className="rounded-3xl border border-[#D6D3C8] bg-white p-6 shadow-sm">
            <div className="text-3xl">🧠</div>
            <h3 className="mt-4 text-xl font-black text-[#166534]">
              Smart Quizzes
            </h3>
            <p className="mt-3 leading-7 text-[#64748B]">
              Test your understanding with topic-based interactive questions.
            </p>
          </div>

          <div className="rounded-3xl border border-[#D6D3C8] bg-white p-6 shadow-sm">
            <div className="text-3xl">🚀</div>
            <h3 className="mt-4 text-xl font-black text-[#166534]">
              Learn Your Way
            </h3>
            <p className="mt-3 leading-7 text-[#64748B]">
              Choose a difficulty level that matches your learning goals.
            </p>
          </div>
        </section>

        <p className="mt-10 text-center text-sm text-[#9CA3AF]">
          Powered by AI • Learn at your own pace
        </p>
      </div>
    </main>
  );
}