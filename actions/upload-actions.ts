"use server";

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
      message: "File upload fail",
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
      message: "File upload fail",
    };
  }

  try {
    const pdfText = await fetchAndExtractPDFText(pdfUrl);
    console.log("pdfText", pdfText);
  } catch (error) {
    return {
      success: false,
      message: "File upload fail",
    };
  }
}
