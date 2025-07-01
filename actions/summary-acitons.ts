"use server";

import { getDbConnection } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function deleteSummaryAction({
  summaryId,
}: {
  summaryId: string;
}) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    console.log("---- deleteSummaryAction  user ------", user);

    if (!userId) {
      throw new Error("User not found");
    }

    const sql = await getDbConnection();
    console.log("1 sql", sql);
    // delete from db

    const result = await sql`
    DELETE FROM pdf_summaries
    WHERE id = ${summaryId} AND user_id = ${userId}
    RETURNING id;`;

    console.log("---- deleteSummaryAction result----", result);

    // revalidate path
    if (result.length > 0) {
      revalidatePath("/dashboard");
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error("Error deleting the summary:", error);
    return { success: false };
  }
}
