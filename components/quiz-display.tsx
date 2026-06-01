"use client";

import { useState, useEffect } from "react";
import type { QuizSetRecord } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  AlertCircle,
  Trophy,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type ViewState =
  | { view: "library" }
  | { view: "practice"; quizSet: QuizSetRecord }
  | { view: "results"; quizSet: QuizSetRecord; answers: Record<number, number> };

export default function QuizDisplay({ documentId }: { documentId: string }) {
  const [quizSets, setQuizSets] = useState<QuizSetRecord[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [viewState, setViewState] = useState<ViewState>({ view: "library" });

  // Fetch saved quizzes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingLibrary(true);
    fetch(`/api/quiz?documentId=${documentId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setQuizSets(Array.isArray(data) ? data : []))
      .catch(() => setQuizSets([]))
      .finally(() => setIsLoadingLibrary(false));
  }, [documentId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, questionCount }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to generate quiz");
      }

      const newQuiz: QuizSetRecord = await res.json();
      setQuizSets((prev) => [newQuiz, ...prev]);
      // Jump straight into practice
      setViewState({ view: "practice", quizSet: newQuiz });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate quiz";
      setGenerateError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Library View ──────────────────────────────────────────────────────────
  if (viewState.view === "library") {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold">Quiz Library</h2>
          <p className="text-sm text-muted-foreground">
            Generate and practice quizzes from your document
          </p>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-6">
          <div className="py-4 space-y-6">
            {/* Generate New Quiz */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Generate New Quiz</h3>
              </div>
              <div className="flex items-end gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">
                    Number of questions
                  </label>
                  <Input
                    type="number"
                    min={3}
                    max={20}
                    value={questionCount}
                    onChange={(e) =>
                      setQuestionCount(
                        Math.min(Math.max(Number(e.target.value) || 5, 3), 20)
                      )
                    }
                    className="w-24"
                    disabled={isGenerating}
                  />
                </div>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    "Generate Quiz"
                  )}
                </Button>
              </div>
              {generateError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{generateError}</span>
                </div>
              )}
            </Card>

            {/* Saved Quizzes */}
            {isLoadingLibrary ? (
              <div className="flex items-center justify-center h-20 text-muted-foreground text-sm gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading saved quizzes...
              </div>
            ) : quizSets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No quizzes yet. Generate one above!
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Saved Quizzes
                </h3>
                {quizSets.map((quiz) => (
                  <Card
                    key={quiz.id}
                    className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {quiz.questionCount} questions •{" "}
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setViewState({ view: "practice", quizSet: quiz })
                      }
                    >
                      Practice
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ─── Practice View ─────────────────────────────────────────────────────────
  if (viewState.view === "practice") {
    return (
      <PracticeView
        quizSet={viewState.quizSet}
        onFinish={(answers) =>
          setViewState({
            view: "results",
            quizSet: viewState.quizSet,
            answers,
          })
        }
        onBack={() => setViewState({ view: "library" })}
      />
    );
  }

  // ─── Results View ──────────────────────────────────────────────────────────
  return (
    <ResultsView
      quizSet={viewState.quizSet}
      answers={viewState.answers}
      onRetake={() =>
        setViewState({ view: "practice", quizSet: viewState.quizSet })
      }
      onBack={() => setViewState({ view: "library" })}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Practice View (step-by-step)
// ═══════════════════════════════════════════════════════════════════════════════

function PracticeView({
  quizSet,
  onFinish,
  onBack,
}: {
  quizSet: QuizSetRecord;
  onFinish: (answers: Record<number, number>) => void;
  onBack: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const questions = quizSet.questions;
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleSelect = (optionIndex: number) => {
    if (selectedAnswer !== null) return; // already answered
    setSelectedAnswer(optionIndex);
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (isLast) {
      onFinish({ ...answers });
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{quizSet.title}</h2>
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-3 shrink-0">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-6">
        <div className="py-6 max-w-2xl mx-auto">
          <Card className="p-6 space-y-5">
            {/* Question text */}
            <p className="text-lg font-semibold leading-relaxed">
              {currentIndex + 1}. {question.question}
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {question.options.map((option, optIdx) => {
                const isSelected = selectedAnswer === optIdx;
                const isCorrect = question.answerIndex === optIdx;
                const isAnswered = selectedAnswer !== null;

                let className =
                  "w-full text-left px-4 py-3 rounded-lg text-sm border-2 transition-all duration-200 flex items-center gap-3";

                if (!isAnswered) {
                  className +=
                    " border-border hover:border-primary/50 hover:bg-accent cursor-pointer";
                } else if (isCorrect) {
                  className +=
                    " border-emerald-500 bg-emerald-500/10 text-emerald-400";
                } else if (isSelected && !isCorrect) {
                  className +=
                    " border-red-500 bg-red-500/10 text-red-400";
                } else {
                  className += " border-border opacity-40";
                }

                return (
                  <button
                    key={optIdx}
                    className={className}
                    onClick={() => handleSelect(optIdx)}
                    disabled={isAnswered}
                  >
                    <span className="shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-semibold">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {selectedAnswer !== null && (
              <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground border border-border">
                <p className="font-medium text-foreground mb-1">Explanation</p>
                <p>{question.explanation}</p>
              </div>
            )}

            {/* Next / Finish */}
            {selectedAnswer !== null && (
              <div className="flex justify-end">
                <Button onClick={handleNext}>
                  {isLast ? "Finish Quiz" : "Next Question"}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Results View
// ═══════════════════════════════════════════════════════════════════════════════

function ResultsView({
  quizSet,
  answers,
  onRetake,
  onBack,
}: {
  quizSet: QuizSetRecord;
  answers: Record<number, number>;
  onRetake: () => void;
  onBack: () => void;
}) {
  const questions = quizSet.questions;
  const score = questions.filter(
    (q, i) => answers[i] === q.answerIndex
  ).length;
  const percentage = Math.round((score / questions.length) * 100);

  let emoji = "🎉";
  let commentary = "Excellent work!";
  if (percentage < 40) {
    emoji = "📚";
    commentary = "Keep studying — you'll get there!";
  } else if (percentage < 70) {
    emoji = "💪";
    commentary = "Good effort! Review the explanations below.";
  } else if (percentage < 100) {
    emoji = "🌟";
    commentary = "Great job! Almost perfect!";
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-border shrink-0 flex items-center justify-between">
        <h2 className="font-semibold">Quiz Results</h2>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back to Library
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-6">
        <div className="py-6 max-w-2xl mx-auto space-y-6">
          {/* Score Summary */}
          <Card className="p-6 text-center space-y-3">
            <div className="text-4xl">{emoji}</div>
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-3xl font-bold">
                {score}/{questions.length}
              </span>
              <span className="text-lg text-muted-foreground">
                ({percentage}%)
              </span>
            </div>
            <p className="text-muted-foreground">{commentary}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={onRetake}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button onClick={onBack}>Back to Library</Button>
            </div>
          </Card>

          {/* Review all questions */}
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Question Review
          </h3>

          {questions.map((question, qIdx) => {
            const userAnswer = answers[qIdx];
            const isCorrect = userAnswer === question.answerIndex;

            return (
              <Card key={question.id} className="p-5 space-y-3">
                <div className="flex items-start gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium text-sm">
                    {qIdx + 1}. {question.question}
                  </p>
                </div>

                <div className="space-y-1.5 pl-7">
                  {question.options.map((option, optIdx) => {
                    const isUserChoice = userAnswer === optIdx;
                    const isCorrectOpt = question.answerIndex === optIdx;

                    let className = "text-sm px-3 py-1.5 rounded-md ";

                    if (isCorrectOpt) {
                      className += "bg-emerald-500/10 text-emerald-400 font-medium";
                    } else if (isUserChoice) {
                      className += "bg-red-500/10 text-red-400 line-through";
                    } else {
                      className += "text-muted-foreground opacity-60";
                    }

                    return (
                      <p key={optIdx} className={className}>
                        {String.fromCharCode(65 + optIdx)}. {option}
                      </p>
                    );
                  })}
                </div>

                <div className="bg-muted rounded-md px-3 py-2 text-xs text-muted-foreground ml-7">
                  {question.explanation}
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
