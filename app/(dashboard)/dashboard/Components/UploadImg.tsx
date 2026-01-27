"use client";

import React, { ChangeEvent, useCallback, useState } from "react";
import { AiOutlineCloudUpload } from "react-icons/ai";

type Props = {
  handleCallBack: (file: File) => void | Promise<void>;
  id?: string;
  maxMB?: number;
  accept?: string;
  title?: string;
  description?: string;
};

const UploadImg = ({
  handleCallBack,
  id = "image-upload",
  maxMB = 50,
  accept = "image/*",
  title = "Upload a new file",
  description = "Accepted formats: .png, .jpg",
}: Props) => {
  const [data, setData] = useState<{ image: string | null }>({ image: null });
  const [dragActive, setDragActive] = useState(false);

  const readAsDataURL = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setData((prev) => ({ ...prev, image: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const sizeMB = file.size / 1024 / 1024;
      if (sizeMB > maxMB) {
        // You can plug in a toast here if you use one.
        console.warn(`File too big: ${sizeMB.toFixed(2)}MB (max ${maxMB}MB)`);
        return;
      }

      // ✅ notify parent so it can upload to Supabase + store URL
      void handleCallBack(file);

      // ✅ local preview
      readAsDataURL(file);
    },
    [handleCallBack, maxMB, readAsDataURL]
  );

  const onChangePicture = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files && event.currentTarget.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div>
      <div className="space-y-1 mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <label
        htmlFor={id}
        className="group relative mt-2 flex h-56 cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50"
      >
        <div
          className="absolute z-[5] h-full w-full rounded-md"
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

            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        />

        <div
          className={`${
            dragActive ? "border-2 border-black" : ""
          } absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md px-10 transition-all ${
            data.image
              ? "bg-white/80 opacity-0 hover:opacity-100 hover:backdrop-blur-md"
              : "bg-white opacity-100 hover:bg-gray-50"
          }`}
        >
          <AiOutlineCloudUpload
            className={`${
              dragActive ? "scale-110" : "scale-100"
            } h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95`}
          />

          <p className="mt-2 text-center text-sm text-gray-500">
            Drag and drop or click to upload.
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Max file size: {maxMB}MB
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

      <div className="mt-1 flex rounded-md shadow-sm">
        <input
          id={id}
          name="image"
          type="file"
          accept={accept}
          className="sr-only"
          onChange={onChangePicture}
        />
      </div>
    </div>
  );
};

export default UploadImg;
