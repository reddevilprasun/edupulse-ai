import { NextResponse } from "next/server";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function getErrorMessage(error: unknown): { message: string; status: number } {
  const err = error as { message?: string; status?: number; statusCode?: number };
  const status = err?.status ?? err?.statusCode ?? 500;
  const raw = err?.message ?? "";

  // Gemini quota / rate limit
  if (status === 429 || raw.toLowerCase().includes("quota") || raw.toLowerCase().includes("rate limit")) {
    return {
      message: "AI quota exceeded. You have reached the usage limit. Please try again later.",
      status: 429,
    };
  }

  // Auth / API key
  if (status === 401 || status === 403 || raw.toLowerCase().includes("api key")) {
    return {
      message: "AI service authentication failed. Please contact support.",
      status: 503,
    };
  }

  // Model overloaded / server error from provider
  if (status === 503 || raw.toLowerCase().includes("overloaded") || raw.toLowerCase().includes("service unavailable")) {
    return {
      message: "The AI service is temporarily overloaded. Please wait a moment and try again.",
      status: 503,
    };
  }

  // Network / timeout
  if (raw.toLowerCase().includes("timeout") || raw.toLowerCase().includes("network")) {
    return {
      message: "Connection to AI service timed out. Please check your connection and try again.",
      status: 504,
    };
  }

  return {
    message: "Something went wrong while generating the response. Please try again.",
    status: 500,
  };
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const uiMessages = messages as UIMessage[];

    let result;
    try {
      result = streamText({
        model: google("gemini-2.5-flash"),
        system: `You are a helpful study assistant. Answer the user's questions based ONLY on the following document text. If the answer is not in the text, say you do not know.\n\nDocument Text:\n${document.rawText}`,
        messages: await convertToModelMessages(uiMessages),
        onFinish: async ({ text }) => {
          const lastUserMessage = [...uiMessages].reverse().find((m) => m.role === "user");
          const userText =
            lastUserMessage?.parts
              ?.filter((p) => p.type === "text")
              .map((p) => (p as { type: "text"; text: string }).text)
              .join("") ?? "";

          try {
            await prisma.$transaction([
              ...(lastUserMessage
                ? [
                    prisma.chatMessage.upsert({
                      where: { id: lastUserMessage.id },
                      update: {},
                      create: {
                        id: lastUserMessage.id,
                        documentId,
                        userId: session.user.id,
                        role: "user",
                        content: userText,
                      },
                    }),
                  ]
                : []),
              prisma.chatMessage.create({
                data: {
                  documentId,
                  userId: session.user.id,
                  role: "assistant",
                  content: text,
                },
              }),
            ]);
          } catch (dbError) {
            console.error("Failed to persist chat messages:", dbError);
          }
        },
      });
    } catch (aiError) {
      const { message, status } = getErrorMessage(aiError);
      console.error("AI provider error:", aiError);
      return NextResponse.json({ error: message }, { status });
    }

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const { message, status } = getErrorMessage(error);
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
