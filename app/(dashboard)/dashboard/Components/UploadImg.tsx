"use client";

import React, { ChangeEvent, useCallback, useId, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineCloudUpload } from "react-icons/ai";

type UploadImgVariant = "default" | "compact";

type Props = {
  handleCallBack: (file: File) => void;
  id?: string;
  variant?: UploadImgVariant;
  title?: string;
  helperText?: string;
  maxSizeMB?: number;
  className?: string;
};

export default function UploadImg({
  handleCallBack,
  id,
  variant = "default",
  title = "Upload a new file",
  helperText = "Accepted formats: .png, .jpg",
  maxSizeMB = 50,
  className,
}: Props) {
  const autoId = useId();
  const inputId = id ?? `upload-${autoId}`;

  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const dropZoneHeight = variant === "compact" ? "h-40" : "h-56";

  const validateAndProcess = useCallback(
    (file: File) => {
      const sizeMB = file.size / 1024 / 1024;

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file.");
        return;
      }
      if (sizeMB > maxSizeMB) {
        toast.error(`File size too big (max ${maxSizeMB}MB)`);
        return;
      }

      handleCallBack(file);
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [handleCallBack, maxSizeMB]
  );

  const onChangePicture = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      if (!file) return;
      validateAndProcess(file);
      event.currentTarget.value = ""; // allow re-select same file
    },
    [validateAndProcess]
  );

  const hasImage = Boolean(preview);

  return (
    <div className={className}>
      {variant === "default" && (
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
          <p className="text-sm text-gray-500">{helperText}</p>
        </div>
      )}

      <label
        htmlFor={inputId}
        className={`group relative mt-2 flex w-full ${dropZoneHeight} touch-manipulation cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50 focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-2`}
      >
        <div
          className="absolute inset-0 z-[5] rounded-md"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) validateAndProcess(dropped);
          }}
        />

        <div
          className={[
            "absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md px-4 sm:px-10 transition-all",
            dragActive ? "border-2 border-black" : "",
            hasImage
              ? "bg-white/80 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100 hover:backdrop-blur-md"
              : "bg-white opacity-100 hover:bg-gray-50",
          ].join(" ")}
        >
          <AiOutlineCloudUpload
            className={`h-7 w-7 text-gray-500 transition-all duration-75 ${
              dragActive ? "scale-110" : "scale-100"
            } group-hover:scale-110 group-active:scale-95`}
          />

          <p className="mt-2 text-center text-sm text-gray-500">
            {hasImage ? "Tap or click to replace." : "Drag & drop or click to upload."}
          </p>

          <p className="mt-2 text-center text-xs text-gray-500">
            Max file size: {maxSizeMB}MB
          </p>

          <span className="sr-only">Photo upload</span>
        </div>

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
        )}
      </label>

      {fileName && <p className="mt-2 truncate text-xs text-gray-500">{fileName}</p>}

      <input
        id={inputId}
        name="image"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onChangePicture}
      />
    </div>
  );
}
