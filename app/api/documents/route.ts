import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

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
        id: 'desc', // order by newest first roughly
      }
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
