import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Server-side handler for Vercel Blob client uploads.
 * This route generates client tokens so the browser can upload directly to Blob storage,
 * bypassing the serverless function body size limit entirely.
 */
export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Validate the upload before generating a token
        // Only allow PDF uploads
        const filename = pathname.toLowerCase();
        if (!filename.endsWith(".pdf")) {
          throw new Error("Only PDF files are supported.");
        }

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 10 * 1024 * 1024, // Allow up to 10MB via direct upload (no serverless body limit)
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            clientPayload,
          }),
        };
      },
      onUploadCompleted: async () => {
        // We handle processing in a separate /api/upload/process route
        // so this is intentionally a no-op
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const err = error as Error;
    console.error("Upload token error:", err);
    return NextResponse.json(
      {
        error: err.message || "Failed to generate upload token.",
      },
      { status: 400 },
    );
  }
}
