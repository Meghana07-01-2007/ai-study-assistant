 "use client";

import { useState } from "react";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type StudyData = {
  explanation: string;
  example: string;
  keyPoints: string[];
  quiz: QuizQuestion[];
};

export default function Home() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [score, setScore] = useState<number | null>(null);

  const startLearning = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError("");
    setStarted(false);
    setStudyData(null);
    setSelectedAnswers({});
    setScore(null);

    try {
      const response = await fetch("/api/study", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          difficulty,
        }),
      });

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setStudyData(data);
      setStarted(true);
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate the lesson."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionIndex: number, answer: string) => {
    setSelectedAnswers((previous) => ({
      ...previous,
      [questionIndex]: answer,
    }));
  };

  const checkAnswers = () => {
    if (!studyData) return;

    let correct = 0;

    studyData.quiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correct++;
      }
    });

    setScore(correct);
  };

  return (
    <main className="page">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <section className="container">
        <header className="hero">
          <div className="logo">✦</div>

          <p className="eyebrow">AI STUDY ASSISTANT</p>

          <h1>
            Learn anything.
            <br />
            <span>Understand everything.</span>
          </h1>

          <p className="subtitle">
            Enter a topic and let AI create a personalized lesson,
            examples, key points, and a quiz for you.
          </p>
        </header>

        {!started && (
          <section className="setup-card">
            <label>What do you want to learn?</label>

            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Example: Photosynthesis, Newton's Laws, JavaScript..."
              rows={4}
            />

            <label>Difficulty</label>

            <div className="difficulty-row">
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <button
                  key={level}
                  className={
                    difficulty === level
                      ? "difficulty active"
                      : "difficulty"
                  }
                  onClick={() => setDifficulty(level)}
                >
                  {level}
                </button>
              ))}
            </div>

            <button
              className="start-button"
              onClick={startLearning}
              disabled={loading || !topic.trim()}
            >
              {loading ? "Creating your lesson..." : "Start Learning →"}
            </button>

            {error && <p className="error">{error}</p>}
          </section>
        )}

        {started && studyData && (
          <section className="lesson">
            <div className="topic-bar">
              <div>
                <p className="small-label">CURRENT TOPIC</p>
                <h2>{topic}</h2>
              </div>

              <button
                className="new-topic"
                onClick={() => {
                  setStarted(false);
                  setStudyData(null);
                  setScore(null);
                  setSelectedAnswers({});
                }}
              >
                ← New Topic
              </button>
            </div>

            <div className="cards">
              <article className="card explanation-card">
                <div className="number">01</div>
                <h3>Simple Explanation</h3>
                <p>{studyData.explanation}</p>
              </article>

              <article className="card">
                <div className="number">02</div>
                <h3>Real-World Example</h3>
                <p>{studyData.example}</p>
              </article>

              <article className="card key-card">
                <div className="number">03</div>
                <h3>Key Points</h3>

                <ul>
                  {studyData.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </article>
            </div>

            <section className="quiz-section">
              <div className="quiz-heading">
                <div>
                  <p className="small-label">TEST YOUR KNOWLEDGE</p>
                  <h2>Quick Quiz</h2>
                </div>

                {score !== null && (
                  <div className="score">
                    Score: {score}/{studyData.quiz.length}
                  </div>
                )}
              </div>

              {studyData.quiz.map((question, questionIndex) => (
                <article className="question" key={questionIndex}>
                  <p className="question-number">
                    Question {questionIndex + 1}
                  </p>

                  <h3>{question.question}</h3>

                  <div className="options">
                    {question.options.map((option) => {
                      const selected =
                        selectedAnswers[questionIndex] === option;

                      const correct =
                        score !== null && option === question.answer;

                      const wrong =
                        score !== null &&
                        selected &&
                        option !== question.answer;

                      return (
                        <button
                          key={option}
                          className={`option ${
                            selected ? "selected" : ""
                          } ${correct ? "correct" : ""} ${
                            wrong ? "wrong" : ""
                          }`}
                          onClick={() =>
                            score === null &&
                            selectAnswer(questionIndex, option)
                          }
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}

              {score === null && (
                <button
                  className="check-button"
                  onClick={checkAnswers}
                  disabled={
                    Object.keys(selectedAnswers).length !==
                    studyData.quiz.length
                  }
                >
                  Check My Answers ✓
                </button>
              )}
            </section>
          </section>
        )}
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 15% 15%,
              rgba(139, 92, 246, 0.18),
              transparent 35%
            ),
            radial-gradient(
              circle at 85% 80%,
              rgba(34, 211, 238, 0.12),
              transparent 35%
            ),
            #080611;
          color: #f8f7ff;
          padding: 70px 20px;
          position: relative;
          overflow: hidden;
        }

        .container {
          max-width: 1050px;
          margin: auto;
          position: relative;
          z-index: 2;
        }

        .hero {
          text-align: center;
          margin-bottom: 45px;
        }

        .logo {
          width: 58px;
          height: 58px;
          margin: auto;
          display: grid;
          place-items: center;
          border-radius: 18px;
          background: linear-gradient(135deg, #8b5cf6, #22d3ee);
          font-size: 28px;
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.35);
        }

        .eyebrow,
        .small-label {
          color: #a78bfa;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
        }

        h1 {
          font-size: clamp(42px, 7vw, 78px);
          line-height: 0.98;
          margin: 18px 0;
          letter-spacing: -4px;
        }

        h1 span {
          background: linear-gradient(90deg, #a78bfa, #22d3ee);
          -webkit-background-clip: text;
          color: transparent;
        }

        .subtitle {
          max-width: 650px;
          margin: auto;
          color: #aaa6bd;
          font-size: 17px;
          line-height: 1.7;
        }

        .setup-card,
        .card,
        .question {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(17, 14, 31, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 24px;
        }

        .setup-card {
          max-width: 700px;
          margin: auto;
          padding: 30px;
        }

        label {
          display: block;
          font-weight: 700;
          margin-bottom: 10px;
        }

        textarea {
          width: 100%;
          resize: vertical;
          background: #0d0a18;
          border: 1px solid #30294a;
          border-radius: 15px;
          color: white;
          padding: 18px;
          font-size: 16px;
          outline: none;
          margin-bottom: 24px;
        }

        textarea:focus {
          border-color: #8b5cf6;
        }

        .difficulty-row {
          display: flex;
          gap: 10px;
          margin-bottom: 25px;
        }

        .difficulty {
          flex: 1;
          padding: 13px;
          border: 1px solid #30294a;
          background: #0d0a18;
          color: #aaa6bd;
          border-radius: 12px;
          cursor: pointer;
        }

        .difficulty.active {
          border-color: #8b5cf6;
          color: white;
          background: rgba(139, 92, 246, 0.15);
        }

        .start-button,
        .check-button {
          width: 100%;
          border: none;
          border-radius: 14px;
          padding: 16px;
          background: linear-gradient(90deg, #8b5cf6, #06b6d4);
          color: white;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .error {
          color: #fb7185;
          margin-top: 15px;
        }

        .topic-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .topic-bar h2 {
          margin: 5px 0 0;
          font-size: 32px;
        }

        .new-topic {
          background: transparent;
          border: 1px solid #39314f;
          color: #c4b5fd;
          border-radius: 12px;
          padding: 11px 16px;
          cursor: pointer;
        }

        .cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .card {
          padding: 27px;
          min-height: 250px;
        }

        .explanation-card {
          grid-column: span 2;
        }

        .number {
          color: #22d3ee;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .card h3 {
          font-size: 21px;
          margin: 10px 0 15px;
        }

        .card p,
        .card li {
          color: #b8b3c8;
          line-height: 1.8;
        }

        .card ul {
          padding-left: 20px;
        }

        .quiz-section {
          margin-top: 45px;
        }

        .quiz-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .quiz-heading h2 {
          font-size: 35px;
          margin: 5px 0 0;
        }

        .score {
          padding: 12px 18px;
          border-radius: 12px;
          background: rgba(34, 211, 238, 0.1);
          color: #67e8f9;
          font-weight: 800;
        }

        .question {
          padding: 25px;
          margin-bottom: 18px;
        }

        .question-number {
          color: #a78bfa;
          font-weight: 800;
        }

        .question h3 {
          font-size: 20px;
          line-height: 1.5;
        }

        .options {
          display: grid;
          gap: 10px;
        }

        .option {
          text-align: left;
          padding: 15px;
          border-radius: 12px;
          border: 1px solid #30294a;
          background: #0d0a18;
          color: #d7d3e4;
          cursor: pointer;
        }

        .option.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.15);
        }

        .option.correct {
          border-color: #34d399;
          background: rgba(52, 211, 153, 0.12);
        }

        .option.wrong {
          border-color: #fb7185;
          background: rgba(251, 113, 133, 0.12);
        }

        .check-button {
          margin-top: 10px;
        }

        @media (max-width: 700px) {
          .page {
            padding: 40px 15px;
          }

          .cards {
            grid-template-columns: 1fr;
          }

          .explanation-card {
            grid-column: span 1;
          }

          .difficulty-row {
            flex-direction: column;
          }

          .topic-bar,
          .quiz-heading {
            gap: 15px;
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}