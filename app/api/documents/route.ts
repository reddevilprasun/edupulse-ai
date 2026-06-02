import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const documents = await prisma.document.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        blobUrl: true,
        createdAt: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing document id." }, { status: 400 });
  }

  try {
    // Verify ownership before deleting
    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, userId: true, blobUrl: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (document.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // Delete from Vercel Blob storage first
    try {
      await del(document.blobUrl);
    } catch (blobError) {
      // Log but don't block DB deletion if blob is already gone
      console.warn("Blob deletion warning:", blobError);
    }

    // Delete from DB — Prisma cascade removes DocChunks, ChatMessages, QuizSets, QuizQuestions
    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: "Failed to delete document." },
      { status: 500 }
    );
  }
}
