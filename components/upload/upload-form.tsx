"use client";

import { useUploadThing } from "@/utils/uploadThing";
import UploadFormInput from "./upload-form-input";
import { z } from "zod";
import { toast } from "react-toastify";
import {
  generatePDFSummary,
  storePDFSummaryAction,
} from "@/actions/upload-actions";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MotionDiv } from "../common/motion-wrapper";
import LoadingSkeleton from "./loading-skeleton";

const schema = z.object({
  file: z
    .instanceof(File, { message: "Invalid file" })
    .refine(
      (file) => file.size <= 20 * 1024 * 1024,
      "File must be less than 20MB"
    )
    .refine(
      (file) => file.type.startsWith("application/pdf"),
      "File must be a PDF"
    ),
});

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { startUpload } = useUploadThing("pdfUploader", {
    onClientUploadComplete: () => {},
    onUploadError: (err) => {
      toast.error(`Error ocurred while uploading: ${err.message}`);
    },
    onUploadBegin: (data) => {
      console.log("data", data);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const formData = new FormData(e.currentTarget);
      const file = formData.get("file") as File;

      // validate the fields with zod
      const validatedFields = schema.safeParse({ file });

      if (!validatedFields.success) {
        toast.error(
          `Something went wrong. ${
            validatedFields.error.flatten().fieldErrors.file?.[0] ??
            "Invalid file"
          }`
        );
        setIsLoading(false);
        return;
      }

      toast.info(`Uploading PDF...✨`);

      // upload file to uploadthing
      const uploadResponse = await startUpload([file]);

      if (!uploadResponse) {
        toast.error(`Something went wrong. Please use a different file.`);
        setIsLoading(false);
        return;
      }

      toast.info(`Processing PDF - Our AI is reading through the document ✨`);

      const uploadedFileUrl = uploadResponse[0].serverData.fileUrl;

      // parse pdf using langchain
      const result = await generatePDFSummary({
        fileName: file.name,
        fileUrl: uploadedFileUrl,
      });

      const { data = null, message = null } = result || {};

      if (data) {
        let storeResult: any;

        toast.info(`Saving PDF - We are saving your summary ✨`);

        if (data.summary) {
          toast.info(
            `Processing PDF - Our AI is reading through the document ✨`
          );
          // save the summary to the database
          storeResult = await storePDFSummaryAction({
            fileUrl: uploadedFileUrl,
            summary: data.summary,
            title: data.title,
            fileName: file.name,
          });

          toast.success(
            `🔥 Summary generated: Your PDF has been successfully sumarized and saved! ✨`
          );

          formRef.current?.reset();
          // redirect to the [id] summary page
          router.push(`/summaries/${storeResult.data.id}`);
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error ocurred", error);
      formRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MotionDiv className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-muted-foreground text-sm">
            Upload PDF
          </span>
        </div>
      </div>
      <UploadFormInput
        isLoading={isLoading}
        ref={formRef}
        onSubmit={handleSubmit}
      />
      {isLoading && (
        <>
          <div className="relative">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-muted-foreground text-sm">
                Processing
              </span>
            </div>
          </div>
          <LoadingSkeleton />
        </>
      )}
    </MotionDiv>
  );
}
