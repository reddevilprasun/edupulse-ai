import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  PDFParse,
  AbortException,
  FormatError,
  InvalidPDFException,
  PasswordException,
  ResponseException,
  UnknownErrorException,
} from "pdf-parse";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "File is required." }, { status: 400 });
    }

    if (file.type && file.type !== "application/pdf") {
      return Response.json(
        { error: "Only PDF files are supported." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        { error: "File exceeds the 4.5MB upload limit." },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length === 0) {
      return Response.json(
        { error: "Uploaded file is empty." },
        { status: 400 },
      );
    }

    const header = buffer.subarray(0, 4).toString("utf8");

    if (header !== "%PDF") {
      return Response.json(
        { error: "Invalid PDF header. Please upload a valid PDF." },
        { status: 400 },
      );
    }
    const parser = new PDFParse({ data: buffer });
    let rawText = "";

    try {
      const parsed = await parser.getText();
      rawText = parsed.text ?? "";
    } catch (parseError) {
      let message = "Failed to parse PDF content.";

      if (parseError instanceof PasswordException) {
        message = "PDF is password protected.";
      } else if (parseError instanceof InvalidPDFException) {
        message = "Invalid PDF content.";
      } else if (parseError instanceof FormatError) {
        message = "PDF format error.";
      } else if (parseError instanceof ResponseException) {
        message = "Failed to read PDF data.";
      } else if (parseError instanceof AbortException) {
        message = "PDF parsing was aborted.";
      } else if (parseError instanceof UnknownErrorException) {
        message = "Unknown PDF parsing error.";
      } else if (parseError instanceof Error && parseError.message) {
        message = parseError.message;
      }

      return Response.json({ error: message }, { status: 422 });
    } finally {
      await parser.destroy();
    }

    let blobUrl = "";

    try {
      const blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      });
      blobUrl = blob.url;
    } catch (uploadError) {
      const err = uploadError as Error;
      console.error("Blob upload error:", err);
      return Response.json(
        {
          error: "Failed to upload PDF to storage.",
          details: err?.message,
        },
        { status: 502 },
      );
    }



    const document = await prisma.document.create({
      data: {
        title: file.name,
        blobUrl: blobUrl,
        rawText,
        userId: userId,
      },
    });

    return Response.json({ id: document.id, title: document.title });
  } catch (error) {
    const err = error as Error;
    console.error("Global upload error:", err);
    return Response.json(
      { error: "Failed to upload or parse the PDF.", details: err?.message },
      { status: 500 },
    );
  }
}
