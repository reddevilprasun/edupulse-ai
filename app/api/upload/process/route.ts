import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { del } from "@vercel/blob";

export const runtime = "nodejs";

// Allow up to 60 seconds for PDF parsing on serverless
export const maxDuration = 60;

interface ProcessRequest {
  blobUrl: string;
  filename: string;
}

import { extractText, getDocumentProxy } from 'unpdf';

/**
 * Extract text from a PDF buffer using unpdf.
 * unpdf is explicitly built for serverless environments (Node, Vercel Edge, etc.)
 * and handles PDF.js browser dependencies (like DOMMatrix) safely without crashing.
 */
async function extractTextFromPdf(buffer: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/**
 * After a file is uploaded to Vercel Blob via the client-side upload,
 * this route fetches the PDF from the blob URL, parses the text content,
 * and saves the document record in the database.
 *
 * This keeps the heavy PDF parsing separate from the upload flow and
 * avoids any body-size limits since we're fetching from a URL, not receiving a file.
 */
export async function POST(request: Request) {
  let blobUrl: string | null = null;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse the request — it's a small JSON payload, not a file
    const body = (await request.json()) as ProcessRequest;
    blobUrl = body.blobUrl;
    const filename = body.filename;

    if (!blobUrl || typeof blobUrl !== "string") {
      return Response.json(
        { error: "Blob URL is required." },
        { status: 400 },
      );
    }

    if (!filename || typeof filename !== "string") {
      return Response.json(
        { error: "Filename is required." },
        { status: 400 },
      );
    }

    // ── Fetch the PDF from Blob storage ─────────────────────────────────────
    let pdfBuffer: Uint8Array;

    try {
      const pdfResponse = await fetch(blobUrl);

      if (!pdfResponse.ok) {
        throw new Error(
          `Failed to fetch PDF from storage (status: ${pdfResponse.status})`,
        );
      }

      const arrayBuffer = await pdfResponse.arrayBuffer();
      pdfBuffer = new Uint8Array(arrayBuffer);
    } catch (fetchError) {
      const err = fetchError as Error;
      console.error("PDF fetch error:", err);
      return Response.json(
        {
          error: "Failed to retrieve the uploaded PDF from storage.",
          details: err.message,
        },
        { status: 502 },
      );
    }

    // ── Validate the PDF ────────────────────────────────────────────────────
    if (pdfBuffer.length === 0) {
      await safeDeleteBlob(blobUrl);
      return Response.json(
        { error: "Uploaded file is empty." },
        { status: 400 },
      );
    }

    const header = new TextDecoder().decode(pdfBuffer.subarray(0, 4));
    if (header !== "%PDF") {
      await safeDeleteBlob(blobUrl);
      return Response.json(
        { error: "Invalid PDF header. Please upload a valid PDF." },
        { status: 400 },
      );
    }

    // ── Parse the PDF text ──────────────────────────────────────────────────
    let rawText = "";

    try {
      rawText = await extractTextFromPdf(pdfBuffer);
    } catch (parseError) {
      const err = parseError as Error;
      console.error("PDF parse error:", err);

      let message = "Failed to parse PDF content.";
      const errMsg = err.message?.toLowerCase() ?? "";

      if (errMsg.includes("password")) {
        message = "PDF is password protected.";
      } else if (errMsg.includes("invalid") || errMsg.includes("corrupt")) {
        message = "Invalid or corrupt PDF content.";
      } else if (errMsg.includes("format")) {
        message = "PDF format error.";
      }

      await safeDeleteBlob(blobUrl);
      return Response.json({ error: message, details: err.message }, { status: 422 });
    }

    if (!rawText.trim()) {
      await safeDeleteBlob(blobUrl);
      return Response.json(
        {
          error:
            "Could not extract any text from this PDF. It may be a scanned image.",
        },
        { status: 422 },
      );
    }

    // ── Save to database ────────────────────────────────────────────────────
    try {
      const document = await prisma.document.create({
        data: {
          title: filename,
          blobUrl: blobUrl,
          rawText,
          userId: userId,
        },
      });

      return Response.json({ 
        id: document.id, 
        title: document.title,
        createdAt: document.createdAt 
      });
    } catch (dbError) {
      const err = dbError as Error;
      console.error("Database save error:", err);
      return Response.json(
        {
          error: "Failed to save document to database.",
          details: err.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const err = error as Error;
    console.error("Global process error:", err);
    return Response.json(
      {
        error: "Failed to process the uploaded PDF.",
        details: err.message,
      },
      { status: 500 },
    );
  }
}

/**
 * Safely attempt to delete a blob — never throws.
 * Used for cleanup when parsing or validation fails.
 */
async function safeDeleteBlob(url: string) {
  try {
    await del(url);
  } catch (e) {
    console.error("Failed to clean up blob:", e);
  }
}
