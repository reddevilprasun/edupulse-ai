import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ─── POST: Generate + save a new quiz ────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId, questionCount = 5 } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 3), 20);

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Count existing quiz sets for this document to generate a title
    const existingCount = await prisma.quizSet.count({
      where: { documentId, userId: session.user.id },
    });

    let result;
    try {
      result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: z.object({
          questions: z.array(
            z.object({
              question: z.string(),
              options: z.array(z.string()).length(4),
              answerIndex: z.number().min(0).max(3),
              explanation: z.string(),
            })
          ).length(count),
        }),
        prompt: `Generate exactly ${count} high-quality multiple-choice questions based ONLY on the following document text. The questions should test comprehension of the core concepts. Each question must have exactly 4 options and a clear explanation of the correct answer.\n\nDocument Text:\n${document.rawText}`,
      });
    } catch (aiError) {
      const err = aiError as { message?: string; status?: number };
      const status = err?.status ?? 500;
      const raw = err?.message ?? "";

      if (status === 429 || raw.toLowerCase().includes("quota") || raw.toLowerCase().includes("rate limit")) {
        return NextResponse.json({ error: "AI quota exceeded. Please try again later." }, { status: 429 });
      }
      if (status === 503 || raw.toLowerCase().includes("overload")) {
        return NextResponse.json({ error: "AI service is temporarily overloaded. Please try again." }, { status: 503 });
      }

      console.error("AI error generating quiz:", aiError);
      return NextResponse.json({ error: "Failed to generate quiz. Please try again." }, { status: 500 });
    }

    const title = `Quiz Set #${existingCount + 1} — ${count} Questions`;

    // Persist quiz set + questions in a single transaction
    const quizSet = await prisma.quizSet.create({
      data: {
        documentId,
        userId: session.user.id,
        title,
        questionCount: count,
        questions: {
          create: result.object.questions.map((q, i) => ({
            question: q.question,
            options: q.options,
            answerIndex: q.answerIndex,
            explanation: q.explanation,
            sortOrder: i,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(quizSet);
  } catch (error) {
    console.error("Quiz API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─── GET: List saved quizzes for a document ──────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    const quizSets = await prisma.quizSet.findMany({
      where: { documentId, userId: session.user.id },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quizSets);
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}
