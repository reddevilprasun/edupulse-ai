"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function QuizDisplay({
  questions,
  isLoading,
  onGenerate,
}: {
  questions: QuizQuestion[];
  isLoading: boolean;
  onGenerate: () => void;
}) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Quiz Generator</h2>
          <p className="text-sm text-muted-foreground">
            Auto-generated from your document
          </p>
        </div>
        <Button onClick={onGenerate} disabled={isLoading} size="sm">
          {isLoading ? "Generating..." : "Generate Quiz"}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="py-4 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground text-sm">
              Generating quiz from your document...
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground text-sm">
              Click &quotGenerate Quiz&quot to create questions from your document
            </div>
          ) : (
            questions.map((question, questionIndex) => {
              const selectedAnswer = selectedAnswers[questionIndex];
              const isAnswered = selectedAnswer !== undefined;

              return (
                <Card key={questionIndex} className="p-5">
                  <p className="font-medium text-sm mb-3">
                    {questionIndex + 1}. {question.question}
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selectedAnswer === optionIndex;
                      const isCorrect = question.answerIndex === optionIndex;

                      let optionClassName =
                        "w-full text-left px-4 py-2 rounded-lg text-sm border transition-colors";

                      if (!isAnswered) {
                        optionClassName +=
                          " border-border hover:bg-accent hover:text-accent-foreground";
                      } else if (isCorrect) {
                        optionClassName +=
                          " border-green-500 bg-green-500/10 text-green-400";
                      } else if (isSelected) {
                        optionClassName +=
                          " border-red-500 bg-red-500/10 text-red-400";
                      } else {
                        optionClassName += " border-border opacity-50";
                      }

                      return (
                        <button
                          key={optionIndex}
                          className={optionClassName}
                          onClick={
                            selectedAnswer === undefined
                              ? () =>
                                  setSelectedAnswers((prev) => ({
                                    ...prev,
                                    [questionIndex]: optionIndex,
                                  }))
                              : undefined
                          }
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {selectedAnswer !== undefined ? (
                    <p className="mt-3 text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                      {question.explanation}
                    </p>
                  ) : null}
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
