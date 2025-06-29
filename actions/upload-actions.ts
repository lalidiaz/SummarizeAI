"use server";

import { generateSummaryFromGemini } from "@/lib/geminiai";
import { fetchAndExtractPDFText } from "@/lib/langchain";

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

      return {
        success: true,
        message: "Summary generated successfully. ",
        data: {
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
