"use server";

import { getDbConnection } from "@/lib/db";
import { generateSummaryFromGemini } from "@/lib/geminiai";
import { fetchAndExtractPDFText } from "@/lib/langchain";
import { formatFileNameAsTitle } from "@/utils/format-utils";
import { auth } from "@clerk/nextjs/server";

interface PDFSummaryType {
  userId?: string;
  fileUrl: string;
  summary: string;
  title: string;
  fileName: string;
}

export async function generatePDFSummary(
  uploadResponse: [
    {
      serverData: { userId: string; file: { url: string; name: string } };
    }
  ]
) {
  if (!uploadResponse) {
    return {
      success: false,
      message: "File upload failed",
      data: null,
    };
  }

  const {
    serverData: {
      userId,
      file: { url: pdfUrl, name: fileName },
    },
  } = uploadResponse[0];

  if (!pdfUrl) {
    return {
      success: false,
      message: "File upload failed",
      data: null,
    };
  }

  try {
    const pdfText = await fetchAndExtractPDFText(pdfUrl);
    console.log("pdfText", pdfText);

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
    await sql`INSERT INTO pdf_summaries (
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

  );`;
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
  // user is logged in and has a user id

  // save pdf summary
  // savePDFSummary

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

    return {
      success: true,
      message: "PDF summary saved successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error saving PDF summary.",
    };
  }
}
