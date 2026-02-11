"use client";

import React, { ChangeEvent, useCallback, useId, useState } from "react";
import { AiOutlineCloudUpload } from "react-icons/ai";

type Props = {
  handleCallBack: (file: File) => void;
  id?: string;
};

const UploadImg = ({ handleCallBack, id }: Props) => {
  const autoId = useId();
  const inputId = id ?? autoId;

  const [data, setData] = useState<{ image: string | null }>({ image: null });
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const onChangePicture = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.currentTarget.files && event.currentTarget.files[0];
      if (nextFile) {
        if (nextFile.size / 1024 / 1024 > 3) {
          // toast.error('File size too big (max 3MB)')
        } else {
          handleCallBack(nextFile);
          setFile(nextFile);

          const reader = new FileReader();
          reader.onload = (e) => {
            setData((prev) => ({ ...prev, image: e.target?.result as string }));
          };
          reader.readAsDataURL(nextFile);
        }
      }
    },
    [handleCallBack],
  );

  const hasImage = Boolean(data.image);

  const overlayBase =
    "absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md transition-all";
  const overlayPadding = "px-4 sm:px-10";
  const overlayEmpty =
    "bg-white opacity-100 hover:bg-gray-50 group-active:bg-gray-50";
  const overlayWithImage =
    "bg-white/80 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100 hover:backdrop-blur-md";
  const overlayDrag = dragActive ? "border-2 border-black opacity-100" : "";

  return (
    <div className="w-full">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold sm:text-xl">Upload a new file</h2>
        <p className="text-sm text-gray-500">Accepted formats: .png, .jpg</p>
      </div>

      <label
        htmlFor={inputId}
        className="group relative mt-2 flex h-48 w-full touch-manipulation cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50 focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-2 sm:h-56"
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

            const droppedFile = e.dataTransfer.files && e.dataTransfer.files[0];
            if (droppedFile) {
              if (droppedFile.size / 1024 / 1024 > 50) {
                // toast.error("File size too big (max 50MB)");
              } else {
                setFile(droppedFile);
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setData((prev) => ({
                    ...prev,
                    image: ev.target?.result as string,
                  }));
                };
                reader.readAsDataURL(droppedFile);
              }
            }
          }}
        />

        <div
          className={`${overlayBase} ${overlayPadding} ${
            hasImage ? overlayWithImage : overlayEmpty
          } ${overlayDrag}`}
        >
          <AiOutlineCloudUpload
            className={`${
              dragActive ? "scale-110" : "scale-100"
            } h-8 w-8 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95 sm:h-7 sm:w-7`}
          />

          <p className="mt-2 text-center text-sm text-gray-500">
            {hasImage ? "Tap or click to replace." : "Drag and drop or click to upload."}
          </p>

          <p className="mt-2 text-center text-sm text-gray-500">
            Max file size: 50MB
          </p>

          <span className="sr-only">Photo upload</span>
        </div>

        {data.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.image}
            alt="Preview"
            className="h-full w-full rounded-md object-cover"
          />
        )}
      </label>

      {file?.name && (
        <p className="mt-2 truncate text-xs text-gray-500">{file.name}</p>
      )}

      {hasImage && (
        <p className="mt-1 text-xs text-gray-500 md:hidden">
          Tip: tap the image preview to replace it.
        </p>
      )}

      <div className="mt-1 flex rounded-md shadow-sm">
        <input
          id={inputId}
          name="image"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onChangePicture}
        />
      </div>
    </div>
  );
};

export default UploadImg;
