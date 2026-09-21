 "use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";

type WorkflowItem = {
  step: string;
  description: string;
};

type ImageItem = {
  title?: string;
  explanation?: string;
  imageUrl?: string;
  sourceUrl?: string;
  sourceTitle?: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type DiagramComponent = {
  name: string;
  role: string;
};

type IntermediateDiagramExplanation = {
  overview: string;
  components: DiagramComponent[];
  workingProcess: string[];
  connections: string;
  practicalExample: string;
};

type AdvancedDiagramExplanation = {
  technicalOverview: string;
  internalMechanism: string;
  dataFlow: string;
  dependencies: string;
  limitations: string;
  optimization: string;
  advancedApplications: string;
};

type DiagramExplanation = {
  beginner?: string;
  intermediate?: IntermediateDiagramExplanation;
  advanced?: AdvancedDiagramExplanation;
};

type StudyData = {
  topic: string;
  difficulty?: string;
  explanation: string;
  example: string;
  keyPoints: string[];
  extraInfo?: string;
  extraInformation?: string[] | string;
  deepDive: string;
  workflow: WorkflowItem[];
  images: ImageItem[];
  quiz: QuizQuestion[];
  diagramExplanation?: DiagramExplanation;
};

export default function StudyPage() {
  const [studyData, setStudyData] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>(
    {}
  );

  useEffect(() => {
    const savedData = sessionStorage.getItem("novaStudyData");

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as StudyData;
        setStudyData(parsedData);
      } catch {
        setStudyData(null);
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f3e8] px-6">
        <p className="text-lg text-[#174c3c]">
          Loading your study material...
        </p>
      </main>
    );
  }

  if (!studyData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f8f3e8] px-6 text-center">
        <h1 className="mb-4 text-3xl font-bold text-[#174c3c]">
          No study material found
        </h1>

        <p className="mb-6 text-gray-600">
          Please return to the home page and create a lesson.
        </p>

        <Link
          href="/"
          className="rounded-xl bg-[#174c3c] px-6 py-3 font-semibold text-white transition hover:bg-[#0f382c]"
        >
          Go Home
        </Link>
      </main>
    );
  }

  const keyPoints = Array.isArray(studyData.keyPoints)
    ? studyData.keyPoints
    : [];

  const extraInformation = Array.isArray(studyData.extraInformation)
    ? studyData.extraInformation
    : studyData.extraInformation
      ? [studyData.extraInformation]
      : studyData.extraInfo
        ? [studyData.extraInfo]
        : [];

  const workflow = Array.isArray(studyData.workflow)
    ? studyData.workflow
    : [];

  const images = Array.isArray(studyData.images) ? studyData.images : [];

  const diagramExplanation = studyData.diagramExplanation;

  function handleImageError(index: number) {
    setFailedImages((previous) => ({
      ...previous,
      [index]: true,
    }));
  }

  return (
    <main className="min-h-screen bg-[#f8f3e8] px-4 py-8 text-[#173f34] sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#b78628]">
              AI Study Assistant
            </p>

            <h1 className="text-3xl font-bold sm:text-4xl">
              {studyData.topic}
            </h1>

            {studyData.difficulty && (
              <p className="mt-2 text-sm text-gray-600">
                Difficulty:{" "}
                <span className="font-semibold text-[#174c3c]">
                  {studyData.difficulty}
                </span>
              </p>
            )}
          </div>

          <Link
            href="/"
            className="rounded-xl border border-[#174c3c] px-5 py-3 text-center font-semibold text-[#174c3c] transition hover:bg-[#174c3c] hover:text-white"
          >
            New Topic
          </Link>
        </header>

        {/* Explanation */}
        <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-2xl font-bold text-[#174c3c]">
            Explanation
          </h2>

          <p className="whitespace-pre-line leading-8 text-gray-700">
            {studyData.explanation}
          </p>
        </section>

        {/* Real-World Example */}
        <section className="mb-6 rounded-3xl border-l-8 border-[#b78628] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-2xl font-bold text-[#174c3c]">
            Real-World Example
          </h2>

          <p className="whitespace-pre-line leading-8 text-gray-700">
            {studyData.example}
          </p>
        </section>

        {/* Key Points */}
        {keyPoints.length > 0 && (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-2xl font-bold text-[#174c3c]">
              Key Points
            </h2>

            <ul className="space-y-3">
              {keyPoints.map((point, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 leading-7 text-gray-700"
                >
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#174c3c] text-sm font-bold text-white">
                    {index + 1}
                  </span>

                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Extra Information */}
        {extraInformation.length > 0 && (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-2xl font-bold text-[#174c3c]">
              Extra Information
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {extraInformation.map((info, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-[#f8f3e8] p-4 leading-7 text-gray-700"
                >
                  {info}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Deep Dive */}
        {studyData.deepDive && (
          <section className="mb-6 rounded-3xl bg-[#174c3c] p-6 text-white shadow-sm sm:p-8">
            <h2 className="mb-4 text-2xl font-bold">Deep Dive</h2>

            <p className="whitespace-pre-line leading-8 text-white/90">
              {studyData.deepDive}
            </p>
          </section>
        )}

        {/* Diagram Explanation */}
        {diagramExplanation && (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-2xl font-bold text-[#174c3c]">
              Diagram Explanation
            </h2>

            {/* Beginner Level */}
            {diagramExplanation.beginner && (
              <div className="mb-8">
                <h3 className="mb-3 text-xl font-bold text-[#b78628]">
                  Beginner Level
                </h3>

                <p className="whitespace-pre-line leading-8 text-gray-700">
                  {diagramExplanation.beginner}
                </p>
              </div>
            )}

            {/* Intermediate Level */}
            {diagramExplanation.intermediate && (
              <div className="mb-8 rounded-2xl bg-[#f8f3e8] p-5">
                <h3 className="mb-4 text-xl font-bold text-[#b78628]">
                  Intermediate Level
                </h3>

                {diagramExplanation.intermediate.overview && (
                  <div className="mb-5">
                    <h4 className="mb-2 text-lg font-semibold text-[#174c3c]">
                      Overview
                    </h4>

                    <p className="whitespace-pre-line leading-7 text-gray-700">
                      {diagramExplanation.intermediate.overview}
                    </p>
                  </div>
                )}

                {diagramExplanation.intermediate.components?.length > 0 && (
                  <div className="mb-5">
                    <h4 className="mb-2 text-lg font-semibold text-[#174c3c]">
                      Component Roles
                    </h4>

                    <div className="space-y-3">
                      {diagramExplanation.intermediate.components.map(
                        (component, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-white p-4 shadow-sm"
                          >
                            <h5 className="font-bold text-[#174c3c]">
                              {component.name}
                            </h5>

                            <p className="mt-1 leading-7 text-gray-700">
                              {component.role}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {diagramExplanation.intermediate.workingProcess?.length >
                  0 && (
                  <div className="mb-5">
                    <h4 className="mb-2 text-lg font-semibold text-[#174c3c]">
                      Working Process
                    </h4>

                    <ol className="list-decimal space-y-2 pl-6 text-gray-700">
                      {diagramExplanation.intermediate.workingProcess.map(
                        (step, index) => (
                          <li key={index} className="leading-7">
                            {step}
                          </li>
                        )
                      )}
                    </ol>
                  </div>
                )}

                {diagramExplanation.intermediate.connections && (
                  <div className="mb-5">
                    <h4 className="mb-2 text-lg font-semibold text-[#174c3c]">
                      Connections Between Components
                    </h4>

                    <p className="whitespace-pre-line leading-7 text-gray-700">
                      {diagramExplanation.intermediate.connections}
                    </p>
                  </div>
                )}

                {diagramExplanation.intermediate.practicalExample && (
                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-[#174c3c]">
                      Practical Example
                    </h4>

                    <p className="whitespace-pre-line leading-7 text-gray-700">
                      {diagramExplanation.intermediate.practicalExample}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Level */}
            {diagramExplanation.advanced && (
              <div className="rounded-2xl bg-[#174c3c] p-5 text-white">
                <h3 className="mb-4 text-xl font-bold text-[#f4d58d]">
                  Advanced Level
                </h3>

                <div className="space-y-5">
                  {diagramExplanation.advanced.technicalOverview && (
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-[#f4d58d]">
                        Technical Overview
                      </h4>

                      <p className="whitespace-pre-line leading-7 text-white/90">
                        {diagramExplanation.advanced.technicalOverview}
                      </p>
                    </div>
                  )}

                  {diagramExplanation.advanced.internalMechanism && (
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-[#f4d58d]">
                        Internal Mechanism
                      </h4>

                      <p className="whitespace-pre-line leading-7 text-white/90">
                        {diagramExplanation.advanced.internalMechanism}
                      </p>
                    </div>
                  )}

                  {diagramExplanation.advanced.dataFlow && (
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-[#f4d58d]">
                        Data Flow
                      </h4>

                      <p className="whitespace-pre-line leading-7 text-white/90">
                        {diagramExplanation.advanced.dataFlow}
                      </p>
                    </div>
                  )}

                  {diagramExplanation.advanced.dependencies && (
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-[#f4d58d]">
                        Dependencies
                      </h4>

                      <p className="whitespace-pre-line leading-7 text-white/90">
                        {diagramExplanation.advanced.dependencies}
                      </p>
                    </div>
                  )}

                  {diagramExplanation.advanced.limitations && (
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-[#f4d58d]">
                        Limitations and Failure Points
                      </h4>

                      <p className="whitespace-pre-line leading-7 text-white/90">
                        {diagramExplanation.advanced.limitations}
                      </p>
                    </div>
                  )}

                  {diagramExplanation.advanced.optimization && (
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-[#f4d58d]">
                        Performance and Optimization
                      </h4>

                      <p className="whitespace-pre-line leading-7 text-white/90">
                        {diagramExplanation.advanced.optimization}
                      </p>
                    </div>
                  )}

                  {diagramExplanation.advanced.advancedApplications && (
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-[#f4d58d]">
                        Advanced Applications
                      </h4>

                      <p className="whitespace-pre-line leading-7 text-white/90">
                        {diagramExplanation.advanced.advancedApplications}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Workflow */}
        {workflow.length > 0 && (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-2xl font-bold text-[#174c3c]">
              Step-by-Step Workflow
            </h2>

            <div className="space-y-5">
              {workflow.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#b78628] font-bold text-white">
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="mb-1 text-lg font-bold text-[#174c3c]">
                      {item.step}
                    </h3>

                    <p className="leading-7 text-gray-700">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Images */}
        {images.length > 0 && (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-2xl font-bold text-[#174c3c]">
              {images.length === 1 ? "Image" : "Images"}
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {images.map((image, index) => {
                const imageUrl = image.imageUrl || "";
                const imageTitle = image.title || `Image ${index + 1}`;

                const imageExplanation =
                  image.explanation ||
                  "This image provides a visual reference for the topic.";

                return (
                  <article
                    key={`${imageUrl}-${index}`}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="flex min-h-64 items-center justify-center bg-gray-100 p-3">
                      {imageUrl && !failedImages[index] ? (
                        <img
                          src={imageUrl}
                          alt={`${imageTitle} related to ${studyData.topic}`}
                          className="max-h-80 w-full object-contain"
                          loading="lazy"
                          onError={() => handleImageError(index)}
                        />
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          <p className="font-semibold">Image unavailable</p>

                          <p className="mt-2 text-sm">
                            The image could not be loaded.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="mb-3 text-xl font-bold text-[#174c3c]">
                        {imageTitle}
                      </h3>

                      <p className="whitespace-pre-line leading-7 text-gray-700">
                        {imageExplanation}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Quiz */}
        <section className="rounded-3xl bg-[#b78628] p-6 text-center shadow-sm sm:p-8">
          <h2 className="mb-3 text-2xl font-bold text-white">
            Test Your Knowledge
          </h2>

          <p className="mb-6 text-white/90">
            Check how much you have learned with a quick quiz.
          </p>

          <Link
            href="/quiz"
            className="inline-block rounded-xl bg-white px-8 py-3 font-bold text-[#174c3c] transition hover:bg-[#f8f3e8]"
          >
            Start Quiz
          </Link>
        </section>
      </div>
    </main>
  );
}