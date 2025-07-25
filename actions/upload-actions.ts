"use server";

import { getDbConnection } from "@/lib/db";
import { generateSummaryFromGemini } from "@/lib/geminiai";
import { fetchAndExtractPDFText } from "@/lib/langchain";
import { formatFileNameAsTitle } from "@/utils/format-utils";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

interface PDFSummaryType {
  userId?: string;
  fileUrl: string;
  summary: string;
  title: string;
  fileName: string;
}

export async function generatePDFSummary({
  fileName,
  fileUrl,
}: {
  fileUrl: string;
  fileName: string;
}) {
  if (!fileUrl) {
    return {
      success: false,
      message: "File upload failed",
      data: null,
    };
  }

  try {
    const pdfText = await fetchAndExtractPDFText(fileUrl);

    try {
      const summary = await generateSummaryFromGemini(pdfText);

      if (!summary) {
        return {
          success: false,
          message: "Failed to create summary",
        };
      }

      const formattedFileName = formatFileNameAsTitle(fileName);
      return {
        success: true,
        message: "Summary generated successfully. ",
        data: {
          title: formattedFileName,
          summary,
        },
      };
    } catch (error) {
      console.error("Gemeni API failed.", error);
      throw new Error("Failed to generate summary with available AI providers");
    }
  } catch (error) {
    return {
      success: false,
      message: "File upload failed",
      data: null,
    };
  }
}

export async function savePDFSummary({
  userId,
  fileUrl,
  summary,
  title,
  fileName,
}: PDFSummaryType) {
  // sql inserting pdf summary

  try {
    const sql = await getDbConnection();
    const [savedSummary] = await sql`
    INSERT INTO pdf_summaries (
      user_id,
      original_file_url,
      summary_text,
      title,
      file_name
    ) VALUES (
      ${userId},
      ${fileUrl},
      ${summary},
      ${title},
      ${fileName}
  ) RETURNING id, summary_text`;
    return savedSummary;
  } catch (error) {
    console.log("Error saving PDF Summary");
    throw error;
  }
}

export async function storePDFSummaryAction({
  fileUrl,
  summary,
  title,
  fileName,
}: PDFSummaryType) {
  let savedSummary: any;
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    savedSummary = await savePDFSummary({
      userId,
      fileUrl,
      summary,
      title,
      fileName,
    });

    if (!savedSummary) {
      return {
        success: false,
        message: "Failed to save PDF summary, please try again.",
      };
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error saving PDF summary.",
    };
  }

  //Revalidate our cache - tell nextjs there's a new update in the cache
  revalidatePath(`/summaries/${savedSummary.id}`);

  return {
    success: true,
    message: "PDF summary saved successfully.",
    data: {
      id: savedSummary.id,
    },
  };
}
