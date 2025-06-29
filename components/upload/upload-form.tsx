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

  const { startUpload, routeConfig } = useUploadThing("pdfUploader", {
    onClientUploadComplete: () => {
      console.log("uploaded successfully!");
    },
    onUploadError: (err) => {
      console.log("error occurred while uploading");
      toast.error(`Error ocurred while uploading: ${err.message}`);
    },
    onUploadBegin: ({ file }) => {
      console.log("upload has begun for", file);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      console.log("submitted");

      const formData = new FormData(e.currentTarget);
      const file = formData.get("file") as File;

      console.log("file", file);

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
      const response = await startUpload([file]);
      console.log("Upload response:", response);
      if (!response) {
        toast.error(`Something went wrong. Please use a different file.`);
        setIsLoading(false);
        return;
      }

      toast.info(`Processing PDF - Our AI is reading through the document ✨`);

      // parse pdf using langchain
      const result = await generatePDFSummary(response);

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
            fileUrl: response[0].serverData.file.url,
            summary: data.summary,
            title: data.title,
            fileName: file.name,
          });

          toast.success(
            `🔥 Summary generated: Your PDF has been successfully sumarized and saved! ✨`
          );

          formRef.current?.reset();
        }
      }
      // summarize pdf using ai
      // save the summary to the database
      // redirect to the [id] summary page
    } catch (error) {
      setIsLoading(false);
      console.error("Error ocurred", error);
      formRef.current?.reset();
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      <UploadFormInput
        isLoading={isLoading}
        ref={formRef}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
